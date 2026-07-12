import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '@/services/auth.service'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '@/validators/auth.validator'
import { successResponse, errorResponse } from '@/utils/response'
import { AppError } from '@/utils/errors'

async function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message, error.errors))
  }
  return reply.status(500).send(errorResponse('Internal server error'))
}

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/register
  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(req.body)
      const user = await AuthService.register(body)
      return reply.status(201).send(successResponse(user, 'Registration successful'))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // POST /api/v1/auth/login
  app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(req.body)
      const result = await AuthService.login(body, app.jwt.sign.bind(app.jwt))
      return reply.send(successResponse(result, 'Login successful'))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // POST /api/v1/auth/logout
  app.post('/logout', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string }
      const result = await AuthService.logout(refreshToken)
      return reply.send(successResponse(result))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body)
      const tokens = await AuthService.refresh(refreshToken, app.jwt.sign.bind(app.jwt))
      return reply.send(successResponse(tokens, 'Token refreshed'))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // GET /api/v1/auth/me
  app.get('/me', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const user = await AuthService.getMe(sub)
      return reply.send(successResponse(user))
    } catch (error) {
      return handleError(error, reply)
    }
  })
}
