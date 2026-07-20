import Fastify, { type FastifyError, type FastifyReply, type FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import rawBody from 'fastify-raw-body'
import { ZodError } from 'zod'
import { AppError } from '@/utils/errors'
import { errorResponse } from '@/utils/response'
import { env } from '@/config/env'

// Routes
import authRoutes from '@/routes/auth.routes'
import productRoutes from '@/routes/product.routes'
import orderRoutes from '@/routes/order.routes'
import paymentRoutes from '@/routes/payment.routes'
import developerRoutes from '@/routes/developer.routes'
import adminRoutes from '@/routes/admin.routes'
import walletRoutes from '@/routes/wallet.routes'
import profileRoutes from '@/routes/profile.routes'
import customerRoutes from '@/routes/customer.routes'
import providerWebhookRoutes from '@/routes/provider-webhook.routes'
import apiKeyAuthPlugin from '@/plugins/api-key-auth'
import adminRbacPlugin from '@/plugins/admin-rbac'
import sandboxRoutes from '@/routes/sandbox.routes'

export async function buildApp() {
  const app = Fastify({
    logger: env.APP_ENV !== 'test',
  })

  // ── Plugins ────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: env.APP_URL,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  // Decorate fastify instance with authenticate method
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  // Decorate fastify instance with authenticateAny method (JWT or API Key)
  app.decorate('authenticateAny', async function (request: FastifyRequest, reply: FastifyReply) {
    if (request.headers['x-api-key']) {
      // Use API Key auth
      await app.authenticateApiKey(request, reply)
      // Map API key context to user session format so routes work seamlessly
      if (request.apiKeyContext) {
        request.user = { sub: request.apiKeyContext.userId, role: 'CUSTOMER' }
      }
    } else {
      // Use JWT auth
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    }
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await app.register(apiKeyAuthPlugin)
  await app.register(adminRbacPlugin)

  await app.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  })

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Cogna API',
        description: 'API-first AI Subscription Marketplace',
        version: '1.0.0',
      },
      servers: [{ url: '/api/v1' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
        },
      },
    },
    hideUntagged: true,
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })

  // ── Routes ─────────────────────────────────────────────────────────────
  await app.register(authRoutes,      { prefix: '/api/v1/auth' })
  await app.register(productRoutes,   { prefix: '/api/v1/products' })
  await app.register(orderRoutes,     { prefix: '/api/v1/orders' })
  await app.register(paymentRoutes,   { prefix: '/api/v1/payments' })
  await app.register(developerRoutes, { prefix: '/api/v1/developer' })
  await app.register(adminRoutes,     { prefix: '/api/v1/admin' })
  await app.register(walletRoutes,    { prefix: '/api/v1/wallet' })
  await app.register(profileRoutes,   { prefix: '/api/v1' })
  await app.register(customerRoutes,  { prefix: '/api/v1' })
  await app.register(providerWebhookRoutes, { prefix: '/api/v1/providers' })
  await app.register(sandboxRoutes,   { prefix: '/api/v1/sandbox' })

  // ── Health Check ───────────────────────────────────────────────────────
  app.get('/health', async () => ({
    success: true,
    message: 'Cogna API is running',
    timestamp: new Date().toISOString(),
  }))

  // ── Global Error Handler ────────────────────────────────────────────────
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof ZodError) {
      const issues = error.issues ?? (error as { errors?: typeof error.issues }).errors ?? []
      return reply.status(400).send(
        errorResponse('Validation failed', issues.map(e => ({ field: e.path.join('.'), message: e.message })))
      )
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(errorResponse(error.message, error.errors))
    }
    // Fastify JWT and other plugin errors carry a numeric statusCode
    if (typeof error.statusCode === 'number') {
      return reply.status(error.statusCode).send(errorResponse(error.message ?? 'Unauthorized'))
    }
    app.log.error(error)
    return reply.status(500).send(errorResponse('Internal server error'))
  })

  return app
}
