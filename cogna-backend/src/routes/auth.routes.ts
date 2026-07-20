import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AuthService } from '@/services/auth.service'
import { DeveloperCapabilityService } from '@/services/developer-capability.service'
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/validators/auth.validator'
import { successResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/forgot-password
  app.post('/forgot-password', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = forgotPasswordSchema.parse(req.body)
      const result = await AuthService.forgotPassword(body.email)
      return reply.send(successResponse(result))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/reset-password
  app.post('/reset-password', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = resetPasswordSchema.parse(req.body)
      const result = await AuthService.resetPassword(body)
      return reply.send(successResponse(result))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/resend-verification
  app.post('/resend-verification', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = forgotPasswordSchema.parse(req.body) // uses { email }
      const result = await AuthService.resendVerification(body.email)
      return reply.send(successResponse(result))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/register
  app.post('/register', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = registerSchema.parse(req.body)
      const user = await AuthService.register(body)
      return reply.status(201).send(successResponse(user, 'Registration successful'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/login
  app.post('/login', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = loginSchema.parse(req.body)
      const result = await AuthService.login(body, app.jwt.sign.bind(app.jwt))
      return reply.send(successResponse(result, 'Login successful'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/logout
  app.post('/logout', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string }
      const result = await AuthService.logout(refreshToken)
      return reply.send(successResponse(result))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/refresh
  app.post('/refresh', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body)
      const tokens = await AuthService.refresh(refreshToken, app.jwt.sign.bind(app.jwt))
      return reply.send(successResponse(tokens, 'Token refreshed'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // GET /api/v1/auth/me
  app.get('/me', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const user = await AuthService.getMe(sub)
      return reply.send(successResponse(user))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // POST /api/v1/auth/developer/enable
  app.post('/developer/enable', { onRequest: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const capability = await DeveloperCapabilityService.enable(sub)
      return reply.send(successResponse(capability, 'Developer capability enabled'))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })
}
