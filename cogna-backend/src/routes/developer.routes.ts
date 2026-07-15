import type { Prisma } from '@prisma/client'
import { getErrorMessage } from '@/utils/error-message';
import { z }               from 'zod'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DeveloperService } from '@/services/developer.service'
import { DeveloperCapabilityService } from '@/services/developer-capability.service'
import { successResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'
import { ValidationError, NotFoundError } from '@/utils/errors'
import prisma from '@/config/database'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  environment: z.enum(['TEST', 'LIVE']).default('TEST'),
  scopes: z.array(z.string()).default([]),
  expiresInDays: z.number().optional(),
})

export default async function developerRoutes(app: FastifyInstance) {

  // All developer routes require JWT authentication
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', async (req) => { await DeveloperCapabilityService.require((req.user as { sub: string }).sub) })

  // GET /api/v1/developer/keys
  app.get('/keys', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const keys    = await DeveloperService.listApiKeys(sub)
      return reply.send(successResponse(keys))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/developer/keys
  app.post('/keys', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { name, environment, scopes, expiresInDays } = createApiKeySchema.parse(req.body)
      const key     = await DeveloperService.createApiKey(sub, name, environment, scopes, expiresInDays)
      return reply.status(201).send(successResponse(key, 'API key created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // DELETE /api/v1/developer/keys/:id
  app.delete('/keys/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub }  = req.user as { sub: string }
      const { id }   = req.params as { id: string }
      const revoked  = await DeveloperService.revokeApiKey(id, sub)
      return reply.send(successResponse(revoked, 'API key revoked'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/developer/webhooks
  app.post('/webhooks', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { url, secret } = req.body as { url: string; secret: string }
      if (!url || !secret) {
        throw new ValidationError('url and secret are required')
      }

      const existing = await prisma.developerWebhookEndpoint.findFirst({
        where: { userId: sub }
      })

      let endpoint
      if (existing) {
        endpoint = await prisma.developerWebhookEndpoint.update({
          where: { id: existing.id },
          data: { url, secret }
        })
      } else {
        endpoint = await prisma.developerWebhookEndpoint.create({
          data: { userId: sub, url, secret }
        })
      }

      return reply.send(successResponse(endpoint, 'Webhook configuration updated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // GET /api/v1/developer/webhooks
  app.get('/webhooks', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const endpoint = await prisma.developerWebhookEndpoint.findFirst({
        where: { userId: sub }
      })
      return reply.send(successResponse(endpoint))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // GET /api/v1/developer/webhooks/deliveries
  app.get('/webhooks/deliveries', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const deliveries = await prisma.developerWebhookDelivery.findMany({
        where: {
          endpoint: { userId: sub }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
      return reply.send(successResponse(deliveries))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/developer/webhooks/deliveries/:id/retry
  app.post('/webhooks/deliveries/:id/retry', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { id } = req.params as { id: string }

      const delivery = await prisma.developerWebhookDelivery.findUnique({
        where: { id },
        include: { endpoint: true }
      })

      if (!delivery || delivery.endpoint.userId !== sub) {
        throw new NotFoundError('Delivery log not found')
      }

      // Trigger actual POST request to simulated target
      try {
        const res = await fetch(delivery.endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Cogna-Signature': delivery.endpoint.secret,
          },
          body: JSON.stringify(delivery.payload),
        })
        const text = await res.text()
        const newDelivery = await prisma.developerWebhookDelivery.create({
          data: {
            endpointId: delivery.endpointId,
            eventId: delivery.eventId,
            eventType: delivery.eventType,
            payload: delivery.payload as Prisma.InputJsonValue,
            statusCode: res.status,
            response: text.slice(0, 1000),
            success: res.ok,
          }
        })
        return reply.send(successResponse(newDelivery, 'Webhook successfully redelivered'))
      } catch (err: unknown) {
        const failDelivery = await prisma.developerWebhookDelivery.create({
          data: {
            endpointId: delivery.endpointId,
            eventId: delivery.eventId,
            eventType: delivery.eventType,
            payload: delivery.payload as Prisma.InputJsonValue,
            statusCode: 0,
            response: `Redelivery failed: ${getErrorMessage(err)}`,
            success: false,
          }
        })
        return reply.send(successResponse(failDelivery, 'Webhook redelivery failed'))
      }
    } catch (error) { return handleRouteError(error, reply) }
  })
}
