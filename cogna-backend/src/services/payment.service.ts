import { randomUUID }         from 'crypto'
import { PaymentRepository }  from '@/repositories/payment.repository'
import { OrderRepository }    from '@/repositories/order.repository'
import { ProductRepository }  from '@/repositories/product.repository'
import { getPaymentGateway }  from '@/payments/GatewayFactory'
import { NotFoundError, ConflictError } from '@/utils/errors'
import type { PaymentGatewayType }       from '@/types/payment-gateway.types'

/**
 * Generate a unique internal Cogna payment reference.
 * Format: cogna_<timestamp>_<random-6-chars>
 */
function generateReference(): string {
  const ts   = Date.now()
  const rand = randomUUID().slice(0, 6)
  return `cogna_${ts}_${rand}`
}

export const PaymentService = {

  /**
   * Initialize a payment session for a PENDING order.
   * - Resolves the correct gateway adapter for the product.
   * - Creates a Payment record in PENDING state.
   * - Returns the gateway's authorization URL for client redirect.
   */
  async initializePayment(
    orderId:       string,
    userId:        string,
    customerEmail: string,
    callbackUrl?:  string
  ) {
    const order = await OrderRepository.findById(orderId)
    if (!order) throw new NotFoundError('Order')

    const product = await ProductRepository.findById(order.productId)
    if (!product) throw new NotFoundError('Product')

    // Guard: only one active payment per order
    const existing = await PaymentRepository.findByOrderId(orderId)
    if (existing) throw new ConflictError('A payment has already been initiated for this order')

    const gateway   = getPaymentGateway(product.paymentGateway as PaymentGatewayType)
    const reference = generateReference()

    const initResult = await gateway.initializePayment({
      amount:      Number(order.amount),
      currency:    order.currency,
      email:       customerEmail,
      reference,
      orderId,
      callbackUrl,
    })

    await PaymentRepository.create({
      orderId,
      userId,
      gateway:   product.paymentGateway as PaymentGatewayType,
      reference: initResult.reference,
      amount:    Number(order.amount),
      currency:  order.currency,
    })

    return {
      authorizationUrl: initResult.authorizationUrl,
      reference:        initResult.reference,
    }
  },

  /**
   * Verify a payment by its internal reference.
   * Updates payment status to PAID or FAILED based on gateway response.
   */
  async verifyPayment(reference: string) {
    const payment = await PaymentRepository.findByReference(reference)
    if (!payment) throw new NotFoundError('Payment')

    const order   = await OrderRepository.findById(payment.orderId)
    if (!order) throw new NotFoundError('Order')

    const product = await ProductRepository.findById(order.productId)
    if (!product) throw new NotFoundError('Product')

    const gateway     = getPaymentGateway(product.paymentGateway as PaymentGatewayType)
    const verifyResult = await gateway.verifyPayment(reference)

    const newStatus = verifyResult.status === 'success' ? 'PAID' : 'FAILED'

    return PaymentRepository.updateStatus(payment.id, newStatus, {
      gatewayReference: verifyResult.gatewayReference,
      paidAt:           verifyResult.paidAt ?? undefined,
      metadata:         { amount: verifyResult.amount },
    })
  },

  /**
   * Handle an inbound gateway webhook.
   * Validates the signature, then re-verifies the payment referenced in the payload.
   * Returns true if processing succeeded, false if signature invalid.
   */
  async handleWebhook(
    gatewayType: PaymentGatewayType,
    rawBody:     string,
    signature:   string
  ): Promise<boolean> {
    const gateway = getPaymentGateway(gatewayType)

    if (!gateway.validateWebhook(rawBody, signature)) return false

    // Extract reference from the webhook payload
    let reference: string
    try {
      const parsed = JSON.parse(rawBody) as { data?: { reference?: string } }
      reference    = parsed.data?.reference ?? ''
    } catch {
      return false
    }

    if (!reference) return false

    const payment = await PaymentRepository.findByReference(reference)
    if (!payment) return false

    const order   = await OrderRepository.findById(payment.orderId)
    if (!order) return false

    const product = await ProductRepository.findById(order.productId)
    if (!product) return false

    const verifyResult = await gateway.verifyPayment(reference)
    const newStatus    = verifyResult.status === 'success' ? 'PAID' : 'FAILED'

    await PaymentRepository.updateStatus(payment.id, newStatus, {
      gatewayReference: verifyResult.gatewayReference,
      paidAt:           verifyResult.paidAt ?? undefined,
      metadata:         { amount: verifyResult.amount },
    })

    return true
  },
}
