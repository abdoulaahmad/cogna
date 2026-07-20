import { randomUUID } from 'crypto'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { WalletRepository } from '@/repositories/wallet.repository'
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

export const WalletService = {
  async getSummary(userId: string) {
    return WalletRepository.getOrCreate(userId)
  },

  async listTransactions(userId: string, page = 1, limit = 20) {
    return WalletRepository.findTransactionsByUserId(userId, page, limit)
  },
  async refundPurchase(input: { userId: string; orderId: string; reason: string; idempotencyKey: string }) {
    const refund = await WalletRepository.refundPurchase(input)
    if (!refund) throw new ConflictError('Eligible wallet purchase was not found')
    return refund
  },
  async purchase(input: { userId: string; productId: string; customerEmail: string; idempotencyKey: string }) {
    const product = await (await import('@/repositories/product.repository')).ProductRepository.findById(input.productId)
    if (!product || !product.active) throw new ConflictError('Product is not available')
    const order = await WalletRepository.purchase({ ...input, providerId: product.providerId, amount: Number(product.price), currency: product.currency })
    if (!order) throw new ConflictError('Insufficient wallet balance')
    
    const { fulfillmentQueue } = await import('@/queue/fulfillment.queue')
    await fulfillmentQueue.add(
      'fulfill-order',
      { orderId: order.id, productId: order.productId, userId: order.userId },
      { jobId: `fulfill_${order.id}` }
    )
    
    return order
  },
  async initializeFunding(input: {
    userId: string; email: string; amount: number; currency: string; gateway: PaymentGatewayType
    idempotencyKey: string; callbackUrl?: string
  }) {
    const existing = await WalletRepository.findFundingByIdempotencyKey(input.idempotencyKey)
    if (existing) {
      if (existing.userId !== input.userId) throw new ForbiddenError('Access denied')
      if (!existing.authorizationUrl) throw new ConflictError('Funding initialization is still in progress')
      return { reference: existing.reference, authorizationUrl: existing.authorizationUrl, accessCode: existing.gatewayReference ?? undefined }
    }

    // Validate gateway readiness before creating a persistent funding attempt.
    const gateway = await PaymentGatewayConfigurationService.getGateway(input.gateway)

    const wallet = await WalletRepository.getOrCreate(input.userId, input.currency)
    if (wallet.currency !== input.currency) throw new ConflictError('Wallet currency does not match funding currency')

    const reference = `wallet_${Date.now()}_${randomUUID().slice(0, 8)}`
    const funding = await WalletRepository.createFunding({
      walletId: wallet.id, userId: input.userId, gateway: input.gateway, reference,
      idempotencyKey: input.idempotencyKey, amount: input.amount, currency: input.currency,
    })
    const result = await gateway.initializePayment({
      amount: input.amount, currency: input.currency, email: input.email, reference, orderId: funding.id, callbackUrl: input.callbackUrl,
    })
    await WalletRepository.saveCheckout(funding.id, result.authorizationUrl, result.gatewayReference)
    return { reference, authorizationUrl: result.authorizationUrl, accessCode: result.gatewayReference }
  },
  async verifyFundingForUser(userId: string, reference: string) {
    const funding = await WalletRepository.findFundingByReference(reference)
    if (!funding) throw new NotFoundError('Wallet funding')
    if (funding.userId !== userId) throw new ForbiddenError('Access denied')
    return this.verifyFunding(reference)
  },

  async verifyFunding(reference: string, gatewayType?: PaymentGatewayType) {
    const funding = await WalletRepository.findFundingByReference(reference)
    if (!funding) throw new ConflictError('Wallet funding was not found')
    if (gatewayType && funding.gateway !== gatewayType) throw new ForbiddenError('Gateway does not match funding')
    if (funding.status === 'COMPLETED') return funding

    const gateway = await PaymentGatewayConfigurationService.getGateway(funding.gateway)
    const result = await gateway.verifyPayment(reference)
    if (result.status !== 'success') return funding
    if (Number(funding.amount) !== result.amount || funding.currency !== result.currency) {
      throw new ConflictError('Gateway funding amount or currency does not match')
    }
    return WalletRepository.creditFunding(funding.id, result.gatewayReference, result.metadata)
  },

  async handleFundingWebhook(gatewayType: PaymentGatewayType, rawBody: string, signature: string) {
    const gateway = await PaymentGatewayConfigurationService.getGateway(gatewayType)
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