import { PaymentGateway } from '@prisma/client'
import { env } from '@/config/env'
import { PaymentGatewayConfigurationRepository } from '@/repositories/payment-gateway-configuration.repository'
import { decryptCredential } from '@/utils/credential-crypto'
import { getPaymentGateway } from '@/payments/GatewayFactory'
import { ConflictError } from '@/utils/errors'
import type { IPaymentGateway } from '@/payments/IPaymentGateway'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

function maskKey(value?: string | null): string | null {
  if (!value) return null
  if (value.length <= 8) return '••••••••'
  return `${value.slice(0, 7)}••••${value.slice(-4)}`
}

function paystackMode(secretKey?: string | null): 'TEST' | 'LIVE' | null {
  if (!secretKey) return null
  if (secretKey.startsWith('sk_test_')) return 'TEST'
  if (secretKey.startsWith('sk_live_')) return 'LIVE'
  return null
}

export const PaymentGatewayConfigurationService = {
  async getPaystackStatus() {
    const record = await PaymentGatewayConfigurationRepository.findByGateway(PaymentGateway.PAYSTACK)
    let storedSecret: string | null = null
    let storedPublic: string | null = null

    try {
      if (record) {
        storedSecret = decryptCredential(record.secretKey)
        storedPublic = record.publicKey ? decryptCredential(record.publicKey) : null
      }
    } catch (error) {
      console.warn(`Failed to decrypt Paystack credentials for admin status: ${(error as Error).message}`)
    }

    const secretKey = storedSecret ?? env.PAYSTACK_SECRET_KEY ?? null
    const publicKey = storedPublic ?? env.PAYSTACK_PUBLIC_KEY ?? null

    return {
      gateway: 'PAYSTACK' as const,
      configured: Boolean(secretKey),
      enabled: record ? record.enabled : Boolean(secretKey),
      source: record ? 'ADMIN_PORTAL' as const : secretKey ? 'ENVIRONMENT' as const : 'NONE' as const,
      mode: paystackMode(secretKey),
      publicKey: maskKey(publicKey),
      secretKey: maskKey(secretKey),
      webhookPath: '/api/v1/payments/webhook/paystack',
      updatedAt: record?.updatedAt ?? null,
    }
  },

  async updatePaystack(input: { publicKey?: string; secretKey?: string; enabled: boolean }) {
    const current = await PaymentGatewayConfigurationRepository.findByGateway(PaymentGateway.PAYSTACK)
    let currentSecret = env.PAYSTACK_SECRET_KEY
    let currentPublic = env.PAYSTACK_PUBLIC_KEY

    try {
      if (current) {
        currentSecret = decryptCredential(current.secretKey)
        currentPublic = current.publicKey ? decryptCredential(current.publicKey) : env.PAYSTACK_PUBLIC_KEY
      }
    } catch (error) {
      console.warn(`Failed to decrypt current Paystack credentials during update: ${(error as Error).message}`)
    }

    const effectiveSecret = input.secretKey ?? currentSecret
    const effectivePublic = input.publicKey !== undefined ? input.publicKey : currentPublic

    if (!effectiveSecret) throw new ConflictError('Paystack secret key is required')
    if (effectivePublic) {
      const secretMode = paystackMode(effectiveSecret)
      const publicMode = effectivePublic.startsWith('pk_live_') ? 'LIVE' : effectivePublic.startsWith('pk_test_') ? 'TEST' : null
      if (!secretMode || publicMode !== secretMode) throw new ConflictError('Paystack public and secret keys must use the same mode')
    }

    await PaymentGatewayConfigurationRepository.upsert(PaymentGateway.PAYSTACK, current ? input : {
      enabled: input.enabled,
      secretKey: effectiveSecret,
      ...(effectivePublic !== undefined && { publicKey: effectivePublic }),
    })
    return this.getPaystackStatus()
  },

  async getPlisioStatus() {
    const record = await PaymentGatewayConfigurationRepository.findByGateway(PaymentGateway.PLISIO)
    let storedSecret: string | null = null

    try {
      if (record) storedSecret = decryptCredential(record.secretKey)
    } catch (error) {
      console.warn(`Failed to decrypt Plisio credentials: ${(error as Error).message}`)
    }

    const secretKey = storedSecret ?? env.PLISIO_SECRET_KEY ?? null
    const testMode = env.PLISIO_TEST_MODE === 'true'

    return {
      gateway: 'PLISIO' as const,
      configured: Boolean(secretKey) || testMode,
      enabled: record ? record.enabled : (Boolean(secretKey) || testMode),
      testMode,
      source: record ? 'ADMIN_PORTAL' as const : secretKey ? 'ENVIRONMENT' as const : 'NONE' as const,
      secretKey: maskKey(secretKey),
      webhookPath: '/api/v1/wallet/webhook/plisio',
      updatedAt: record?.updatedAt ?? null,
    }
  },

  async updatePlisio(input: { secretKey?: string; enabled: boolean }) {
    const current = await PaymentGatewayConfigurationRepository.findByGateway(PaymentGateway.PLISIO)
    let currentSecret = env.PLISIO_SECRET_KEY

    try {
      if (current) currentSecret = decryptCredential(current.secretKey)
    } catch (error) {
      console.warn(`Failed to decrypt current Plisio credentials during update: ${(error as Error).message}`)
    }

    const effectiveSecret = input.secretKey ?? currentSecret
    if (!effectiveSecret && env.PLISIO_TEST_MODE !== 'true') throw new ConflictError('Plisio secret key is required unless PLISIO_TEST_MODE is enabled')

    await PaymentGatewayConfigurationRepository.upsert(PaymentGateway.PLISIO, {
      enabled: input.enabled,
      secretKey: effectiveSecret ?? '__TEST_MODE__',
      ...(input.secretKey !== undefined && { secretKey: input.secretKey }),
    })
    return this.getPlisioStatus()
  },

  async getGateway(gatewayType: PaymentGatewayType): Promise<IPaymentGateway> {
    const record = await PaymentGatewayConfigurationRepository.findByGateway(gatewayType)
    if (!record) {
      if (gatewayType === 'PAYSTACK' && !env.PAYSTACK_SECRET_KEY) {
        throw new ConflictError('Paystack is not configured. Add credentials in Admin → Payment gateways.')
      }
      if (gatewayType === 'MONNIFY' && (!env.MONNIFY_API_KEY || !env.MONNIFY_SECRET_KEY || !env.MONNIFY_CONTRACT_CODE)) {
        throw new ConflictError('Monnify is not configured')
      }
      if (gatewayType === 'PLISIO' && !env.PLISIO_SECRET_KEY && env.PLISIO_TEST_MODE !== 'true') {
        throw new ConflictError('Plisio is not configured. Add the API key in Admin → Crypto settings or set PLISIO_TEST_MODE=true for testing.')
      }
      return getPaymentGateway(gatewayType)
    }
    if (!record.enabled) throw new ConflictError(`${gatewayType} is disabled`)

    let secretKey: string
    let publicKey: string | undefined

    try {
      secretKey = decryptCredential(record.secretKey)
      publicKey = record.publicKey ? decryptCredential(record.publicKey) : undefined
    } catch (error) {
      console.warn(`Failed to decrypt database credentials for ${gatewayType}: ${(error as Error).message}. Falling back to environment variables.`)
      if (gatewayType === 'PAYSTACK' && env.PAYSTACK_SECRET_KEY) {
        return getPaymentGateway(gatewayType)
      }
      if (gatewayType === 'MONNIFY' && env.MONNIFY_API_KEY && env.MONNIFY_SECRET_KEY && env.MONNIFY_CONTRACT_CODE) {
        return getPaymentGateway(gatewayType)
      }
      if (gatewayType === 'PLISIO' && (env.PLISIO_SECRET_KEY || env.PLISIO_TEST_MODE === 'true')) {
        return getPaymentGateway(gatewayType)
      }
      throw new ConflictError(`${gatewayType} credentials could not be decrypted and no environment fallback is configured.`)
    }

    return getPaymentGateway(gatewayType, {
      secretKey,
      ...(gatewayType === 'MONNIFY' && publicKey ? { apiKey: publicKey } : {}),
    })
  },
}