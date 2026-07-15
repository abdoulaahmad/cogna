import { randomUUID } from 'crypto'
import { getPaymentGateway } from '@/payments/GatewayFactory'
import { WalletRepository } from '@/repositories/wallet.repository'
import { ConflictError, ForbiddenError } from '@/utils/errors'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

export const WalletService = {
  async initializeFunding(input: {
    userId: string; email: string; amount: number; currency: string; gateway: PaymentGatewayType
    idempotencyKey: string; callbackUrl?: string
  }) {
    const existing = await WalletRepository.findFundingByIdempotencyKey(input.idempotencyKey)
    if (existing) {
      if (existing.userId !== input.userId) throw new ForbiddenError('Access denied')
      if (!existing.authorizationUrl) throw new ConflictError('Funding initialization is still in progress')
      return { reference: existing.reference, authorizationUrl: existing.authorizationUrl }
    }

    const wallet = await WalletRepository.getOrCreate(input.userId, input.currency)
    if (wallet.currency !== input.currency) throw new ConflictError('Wallet currency does not match funding currency')

    const reference = `wallet_${Date.now()}_${randomUUID().slice(0, 8)}`
    const funding = await WalletRepository.createFunding({
      walletId: wallet.id, userId: input.userId, gateway: input.gateway, reference,
      idempotencyKey: input.idempotencyKey, amount: input.amount, currency: input.currency,
    })
    const result = await getPaymentGateway(input.gateway).initializePayment({
      amount: input.amount, currency: input.currency, email: input.email, reference, orderId: funding.id, callbackUrl: input.callbackUrl,
    })
    await WalletRepository.saveCheckout(funding.id, result.authorizationUrl, result.gatewayReference)
    return { reference, authorizationUrl: result.authorizationUrl }
  },
  async verifyFunding(reference: string, gatewayType?: PaymentGatewayType) {
    const funding = await WalletRepository.findFundingByReference(reference)
    if (!funding) throw new ConflictError('Wallet funding was not found')
    if (gatewayType && funding.gateway !== gatewayType) throw new ForbiddenError('Gateway does not match funding')
    if (funding.status === 'COMPLETED') return funding

    const result = await getPaymentGateway(funding.gateway).verifyPayment(reference)
    if (result.status !== 'success') return funding
    if (Number(funding.amount) !== result.amount || funding.currency !== result.currency) {
      throw new ConflictError('Gateway funding amount or currency does not match')
    }
    return WalletRepository.creditFunding(funding.id, result.gatewayReference, result.metadata)
  },

  async handleFundingWebhook(gatewayType: PaymentGatewayType, rawBody: string, signature: string) {
    const gateway = getPaymentGateway(gatewayType)
    if (!gateway.validateWebhook(rawBody, signature)) return false
    try {
      const parsed = JSON.parse(rawBody) as { data?: { reference?: string } }
      if (!parsed.data?.reference) return false
      await this.verifyFunding(parsed.data.reference, gatewayType)
      return true
    } catch {
      return false
    }
  },
}