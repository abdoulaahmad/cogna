import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { WalletService } from '@/services/wallet.service'
import { initializeWalletFundingSchema, initializeCryptoFundingSchema, walletPurchaseSchema, walletRefundSchema } from '@/validators/wallet.validator'
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

  /** GET /api/v1/wallet/crypto-rate — returns current USDT/NGN rate set by admin */
  app.get('/crypto-rate', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const rate = await WalletService.getCryptoRate()
      return reply.send(successResponse(rate))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.get('/fundings/:reference/verify', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { reference } = req.params as { reference: string }
      return reply.send(successResponse(await WalletService.verifyFundingForUser(sub, reference), 'Wallet funding verification completed'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.post('/refunds', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const body = walletRefundSchema.parse(req.body)
      return reply.status(201).send(successResponse(await WalletService.refundPurchase({ userId: sub, ...body }), 'Wallet refund completed'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.post('/purchase', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const body = walletPurchaseSchema.parse(req.body)
      return reply.status(201).send(successResponse(await WalletService.purchase({ userId: sub, ...body }), 'Wallet purchase created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  /** POST /api/v1/wallet/fund — fiat funding via Paystack/Monnify */
  app.post('/fund', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      let { sub, email } = req.user as { sub: string; email?: string }
      if (!email) {
        const user = await (await import('@/repositories/user.repository')).UserRepository.findById(sub)
        if (!user) return reply.status(401).send({ ok: false, message: 'Unauthorized' })
        email = user.email
      }
      const body = initializeWalletFundingSchema.parse(req.body)
      const result = await WalletService.initializeFunding({ userId: sub, email, ...body })
      return reply.status(201).send(successResponse(result, 'Wallet funding initialized'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  /**
   * POST /api/v1/wallet/fund/crypto — USDT BEP20 funding via Plisio
   * Body: { usdtAmount: number, idempotencyKey: string, callbackUrl?: string }
   * Returns: { reference, authorizationUrl, usdtAmount, ngnEquivalent, rateNgn }
   */
  app.post('/fund/crypto', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      let { sub, email } = req.user as { sub: string; email?: string }
      if (!email) {
        const user = await (await import('@/repositories/user.repository')).UserRepository.findById(sub)
        if (!user) return reply.status(401).send({ ok: false, message: 'Unauthorized' })
        email = user.email
      }
      const body = initializeCryptoFundingSchema.parse(req.body)
      const result = await WalletService.initializeCryptoFunding({ userId: sub, email, ...body })
      return reply.status(201).send(successResponse(result, 'Crypto funding initialized'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  /**
   * POST /api/v1/wallet/webhook/:gateway — inbound webhooks (unauthenticated)
   * Plisio sends form-urlencoded; verify_hash is extracted from body for validation.
   */
  app.post('/webhook/:gateway', { config: { rawBody: true } }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { gateway } = req.params as { gateway: string }
      const raw = req.rawBody
      if (!raw) return reply.status(400).send({ ok: false })
      const payload = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw
      const gatewayUpper = gateway.toUpperCase() as 'PAYSTACK' | 'MONNIFY' | 'PLISIO'

      // Plisio: signature IS the verify_hash inside the form body; no separate header.
      const signature = gatewayUpper === 'PLISIO'
        ? (Object.fromEntries(new URLSearchParams(payload).entries())['verify_hash'] ?? '')
        : (req.headers['x-paystack-signature'] as string) ?? (req.headers['monnify-signature'] as string) ?? ''

      const ok = await WalletService.handleFundingWebhook(gatewayUpper, payload, signature)
      return reply.status(ok ? 200 : 400).send({ ok })
    } catch (error) { return handleRouteError(error, reply) }
  })
}