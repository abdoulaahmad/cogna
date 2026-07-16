import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PaymentService } from '@/services/payment.service'
import { WalletService } from '@/services/wallet.service'
import { initializePaymentSchema } from '@/validators/payment.validator'
import { successResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

export default async function paymentRoutes(app: FastifyInstance) {
  app.post('/initialize', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub, email } = req.user as { sub: string; email: string }
      const body = initializePaymentSchema.parse(req.body)
      const result = await PaymentService.initializePayment(body.orderId, sub, email, body.callbackUrl)
      return reply.status(201).send(successResponse(result, 'Payment initialized'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  app.get('/verify/:reference', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { reference } = req.params as { reference: string }
      const { sub } = req.user as { sub: string }
      const payment = await PaymentService.verifyPayment(reference, sub)
      return reply.send(successResponse(payment, 'Payment verified'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  app.post('/webhook/:gateway', { config: { rawBody: true } }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { gateway } = req.params as { gateway: string }
      const signature = (req.headers['x-paystack-signature'] as string)
        ?? (req.headers['monnify-signature'] as string)
        ?? ''
      const rawBody = req.rawBody
      if (!rawBody) return reply.status(400).send({ ok: false })
      const payload = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody
      const gatewayType = gateway.toUpperCase() as PaymentGatewayType
      let reference = ''
      try {
        const webhook = JSON.parse(payload) as { data?: { reference?: unknown } }
        reference = typeof webhook.data?.reference === 'string' ? webhook.data.reference : ''
      } catch {
        return reply.status(400).send({ ok: false })
      }

      const ok = reference.startsWith('wallet_')
        ? await WalletService.handleFundingWebhook(gatewayType, payload, signature)
        : await PaymentService.handleWebhook(gatewayType, payload, signature)
      return reply.status(ok ? 200 : 400).send({ ok })
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })
}