import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { PaymentService }          from '@/services/payment.service'
import { initializePaymentSchema } from '@/validators/payment.validator'
import { successResponse, errorResponse } from '@/utils/response'
import { AppError } from '@/utils/errors'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

async function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message))
  }
  return reply.status(500).send(errorResponse('Internal server error'))
}

export default async function paymentRoutes(app: FastifyInstance) {

  // POST /api/v1/payments/initialize  (authenticated)
  app.post(
    '/initialize',
    { onRequest: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { sub, email } = req.user as { sub: string; email: string }
        const body           = initializePaymentSchema.parse(req.body)

        const result = await PaymentService.initializePayment(
          body.orderId,
          sub,
          email,
          body.callbackUrl
        )

        return reply.status(201).send(successResponse(result, 'Payment initialized'))
      } catch (error) {
        return handleError(error, reply)
      }
    }
  )

  // GET /api/v1/payments/verify/:reference  (authenticated)
  app.get(
    '/verify/:reference',
    { onRequest: [app.authenticate] },
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { reference } = req.params as { reference: string }
        const payment       = await PaymentService.verifyPayment(reference)
        return reply.send(successResponse(payment, 'Payment verified'))
      } catch (error) {
        return handleError(error, reply)
      }
    }
  )

  // POST /api/v1/payments/webhook/:gateway  (public — signature verified inside service)
  app.post(
    '/webhook/:gateway',
    async (req: FastifyRequest, reply: FastifyReply) => {
      try {
        const { gateway }  = req.params as { gateway: string }
        const signature    = (req.headers['x-paystack-signature'] as string)
                          ?? (req.headers['monnify-signature']     as string)
                          ?? ''
        const rawBody      = JSON.stringify(req.body)

        const ok = await PaymentService.handleWebhook(
          gateway.toUpperCase() as PaymentGatewayType,
          rawBody,
          signature
        )

        return reply.status(ok ? 200 : 400).send({ ok })
      } catch (error) {
        return handleError(error, reply)
      }
    }
  )
}
