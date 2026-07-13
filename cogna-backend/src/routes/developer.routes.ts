import { z }               from 'zod'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { DeveloperService } from '@/services/developer.service'
import { successResponse, errorResponse } from '@/utils/response'
import { AppError } from '@/utils/errors'

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
})

async function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message))
  }
  return reply.status(500).send(errorResponse('Internal server error'))
}

export default async function developerRoutes(app: FastifyInstance) {

  // All developer routes require JWT authentication
  app.addHook('onRequest', app.authenticate)

  // GET /api/v1/developer/keys
  app.get('/keys', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const keys    = await DeveloperService.listApiKeys(sub)
      return reply.send(successResponse(keys))
    } catch (error) { return handleError(error, reply) }
  })

  // POST /api/v1/developer/keys
  app.post('/keys', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { name } = createApiKeySchema.parse(req.body)
      const key     = await DeveloperService.createApiKey(sub, name)
      return reply.status(201).send(successResponse(key, 'API key created'))
    } catch (error) { return handleError(error, reply) }
  })

  // DELETE /api/v1/developer/keys/:id
  app.delete('/keys/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub }  = req.user as { sub: string }
      const { id }   = req.params as { id: string }
      const revoked  = await DeveloperService.revokeApiKey(id, sub)
      return reply.send(successResponse(revoked, 'API key revoked'))
    } catch (error) { return handleError(error, reply) }
  })
}
