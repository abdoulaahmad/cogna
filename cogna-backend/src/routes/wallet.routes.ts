import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { WalletService } from '@/services/wallet.service'
import { initializeWalletFundingSchema } from '@/validators/wallet.validator'
import { handleRouteError } from '@/utils/handle-error'
import { successResponse } from '@/utils/response'

export default async function walletRoutes(app: FastifyInstance) {
  app.addHook('onRequest', app.authenticate)

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