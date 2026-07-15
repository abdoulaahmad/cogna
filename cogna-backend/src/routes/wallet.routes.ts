import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { WalletService } from '@/services/wallet.service'
import { initializeWalletFundingSchema, walletPurchaseSchema, walletRefundSchema } from '@/validators/wallet.validator'
import { handleRouteError } from '@/utils/handle-error'
import { successResponse } from '@/utils/response'

export default async function walletRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate)

  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      return reply.send(successResponse(await WalletService.getSummary(sub)))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.get('/transactions', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number }
      const result = await WalletService.listTransactions(sub, Number(page), Number(limit))
      return reply.send(successResponse(result))
    } catch (error) { return handleRouteError(error, reply) }
  })
  app.post('/refunds', async (req: FastifyRequest, reply: FastifyReply) => {
    try { const { sub } = req.user as { sub: string }; const body = walletRefundSchema.parse(req.body); return reply.status(201).send(successResponse(await WalletService.refundPurchase({ userId: sub, ...body }), 'Wallet refund completed')) } catch (error) { return handleRouteError(error, reply) }
  })
  app.post('/purchase', async (req: FastifyRequest, reply: FastifyReply) => {
    try { const { sub } = req.user as { sub: string }; const body = walletPurchaseSchema.parse(req.body); return reply.status(201).send(successResponse(await WalletService.purchase({ userId: sub, ...body }), 'Wallet purchase created')) } catch (error) { return handleRouteError(error, reply) }
  })
  app.post('/fund', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub, email } = req.user as { sub: string; email: string }
      const body = initializeWalletFundingSchema.parse(req.body)
      const result = await WalletService.initializeFunding({ userId: sub, email, ...body })
      return reply.status(201).send(successResponse(result, 'Wallet funding initialized'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  app.post('/webhook/:gateway', { config: { rawBody: true } }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { gateway } = req.params as { gateway: string }
      const raw = req.rawBody
      if (!raw) return reply.status(400).send({ ok: false })
      const payload = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw
      const signature = (req.headers['x-paystack-signature'] as string) ?? (req.headers['monnify-signature'] as string) ?? ''
      const ok = await WalletService.handleFundingWebhook(gateway.toUpperCase() as 'PAYSTACK' | 'MONNIFY', payload, signature)
      return reply.status(ok ? 200 : 400).send({ ok })
    } catch (error) { return handleRouteError(error, reply) }
  })}