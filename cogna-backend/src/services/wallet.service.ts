import { randomUUID } from 'crypto'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { WalletRepository } from '@/repositories/wallet.repository'
import { ConflictError, ForbiddenError, NotFoundError } from '@/utils/errors'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'
import prisma from '@/config/database'

const USDT_RATE_KEY = 'usdt_rate_ngn'
const PLISIO_WALLET_KEY = 'plisio_wallet_address'

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

  /**
   * Get the current admin-set USDT→NGN exchange rate and wallet address.
   * Returns null for rate if not yet configured.
   */
  async getCryptoRate(): Promise<{ rateNgn: number | null; walletAddress: string | null }> {
    const [rateSetting, walletSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: USDT_RATE_KEY } }),
      prisma.setting.findUnique({ where: { key: PLISIO_WALLET_KEY } }),
    ])
    return {
      rateNgn: rateSetting ? Number(rateSetting.value) : null,
      walletAddress: walletSetting?.value ?? null,
    }
  },

  /**
   * Initialize a Plisio USDT (BEP20) crypto funding session.
   * 1. Reads the current admin-set rate.
   * 2. Locks the NGN equivalent at invoice creation time.
   * 3. Creates a WalletFunding with amount = NGN equivalent, cryptoAmountUsdt = USDT amount.
   * 4. Calls PlisioAdapter with the USDT amount so Plisio generates the correct invoice.
   */
  async initializeCryptoFunding(input: {
    userId: string; email: string; usdtAmount: number; idempotencyKey: string; callbackUrl?: string
  }) {
    const existing = await WalletRepository.findFundingByIdempotencyKey(input.idempotencyKey)
    if (existing) {
      if (existing.userId !== input.userId) throw new ForbiddenError('Access denied')
      if (!existing.authorizationUrl) throw new ConflictError('Funding initialization is still in progress')
      return {
        reference: existing.reference,
        authorizationUrl: existing.authorizationUrl,
        usdtAmount: Number(existing.cryptoAmountUsdt ?? input.usdtAmount),
        ngnEquivalent: Number(existing.amount),
        rateNgn: Number(existing.ngnRateLocked ?? 0),
      }
    }

    // Read and lock current rate
    const rateSetting = await prisma.setting.findUnique({ where: { key: USDT_RATE_KEY } })
    if (!rateSetting) throw new ConflictError('Crypto funding is not available yet. The admin has not set the USDT exchange rate.')

    const rateNgn = Number(rateSetting.value)
    if (!rateNgn || rateNgn <= 0) throw new ConflictError('USDT exchange rate is invalid. Please contact support.')

    const ngnEquivalent = Math.round(input.usdtAmount * rateNgn * 100) / 100 // round to 2dp

    // Validate Plisio gateway is ready
    const gateway = await PaymentGatewayConfigurationService.getGateway('PLISIO')

    const wallet = await WalletRepository.getOrCreate(input.userId, 'NGN')
    if (wallet.currency !== 'NGN') throw new ConflictError('Wallet currency mismatch')

    const reference = `wallet_${Date.now()}_${randomUUID().slice(0, 8)}`

    // Create the funding record with NGN as the credited amount
    const funding = await WalletRepository.createFunding({
      walletId: wallet.id, userId: input.userId, gateway: 'PLISIO', reference,
      idempotencyKey: input.idempotencyKey, amount: ngnEquivalent, currency: 'NGN',
    })

    // Save crypto-specific fields
    await prisma.walletFunding.update({
      where: { id: funding.id },
      data: {
        cryptoAmountUsdt: input.usdtAmount,
        ngnRateLocked: rateNgn,
      },
    })

    // Call Plisio with the USDT amount (not the NGN amount)
    const result = await gateway.initializePayment({
      amount: input.usdtAmount,
      currency: 'USDT',
      email: input.email,
      reference,
      orderId: funding.id,
      callbackUrl: input.callbackUrl,
      metadata: { description: `Cogna wallet funding — ${input.usdtAmount} USDT → ₦${ngnEquivalent.toLocaleString()}` },
    })

    await WalletRepository.saveCheckout(funding.id, result.authorizationUrl, result.gatewayReference)

    return {
      reference,
      authorizationUrl: result.authorizationUrl,
      usdtAmount: input.usdtAmount,
      ngnEquivalent,
      rateNgn,
    }
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

    // For Plisio: the NGN amount is pre-locked in funding.amount, so we skip
    // the amount/currency match check. The webhook confirms USDT receipt;
    // the wallet is credited the locked NGN equivalent.
    if (funding.gateway !== 'PLISIO') {
      if (Number(funding.amount) !== result.amount || funding.currency !== result.currency) {
        throw new ConflictError('Gateway funding amount or currency does not match')
      }
    }
    return WalletRepository.creditFunding(funding.id, result.gatewayReference, result.metadata)
  },

  async handleFundingWebhook(gatewayType: PaymentGatewayType, rawBody: string, signature: string) {
    const gateway = await PaymentGatewayConfigurationService.getGateway(gatewayType)
    if (!gateway.validateWebhook(rawBody, signature)) return false
    try {
      let reference: string | undefined

      if (gatewayType === 'PLISIO') {
        // Plisio sends form-urlencoded: order_number is our reference
        const fields = Object.fromEntries(new URLSearchParams(rawBody).entries())
        reference = fields['order_number']
      } else {
        const parsed = JSON.parse(rawBody) as { data?: { reference?: string } }
        reference = parsed.data?.reference
      }

      if (!reference) return false
      await this.verifyFunding(reference, gatewayType)
      return true
    } catch {
      return false
    }
  },
}