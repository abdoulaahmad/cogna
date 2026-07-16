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
    const storedSecret = record ? decryptCredential(record.secretKey) : null
    const storedPublic = record?.publicKey ? decryptCredential(record.publicKey) : null
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
    const currentSecret = current ? decryptCredential(current.secretKey) : env.PAYSTACK_SECRET_KEY
    const currentPublic = current?.publicKey ? decryptCredential(current.publicKey) : env.PAYSTACK_PUBLIC_KEY
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

  async getGateway(gatewayType: PaymentGatewayType): Promise<IPaymentGateway> {
    const record = await PaymentGatewayConfigurationRepository.findByGateway(gatewayType)
    if (!record) {
      if (gatewayType === 'PAYSTACK' && !env.PAYSTACK_SECRET_KEY) {
        throw new ConflictError('Paystack is not configured. Add credentials in Admin → Payment gateways.')
      }
      if (gatewayType === 'MONNIFY' && (!env.MONNIFY_API_KEY || !env.MONNIFY_SECRET_KEY || !env.MONNIFY_CONTRACT_CODE)) {
        throw new ConflictError('Monnify is not configured')
      }
      return getPaymentGateway(gatewayType)
    }
    if (!record.enabled) throw new ConflictError(`${gatewayType} is disabled`)

    const secretKey = decryptCredential(record.secretKey)
    const publicKey = record.publicKey ? decryptCredential(record.publicKey) : undefined
    return getPaymentGateway(gatewayType, {
      secretKey,
      ...(gatewayType === 'MONNIFY' && publicKey ? { apiKey: publicKey } : {}),
    })
  },
}