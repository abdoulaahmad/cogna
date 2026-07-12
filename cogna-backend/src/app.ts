import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { env } from '@/config/env'

// Routes
import authRoutes from '@/routes/auth.routes'
import productRoutes from '@/routes/product.routes'
import orderRoutes from '@/routes/order.routes'
import paymentRoutes from '@/routes/payment.routes'
import developerRoutes from '@/routes/developer.routes'
import adminRoutes from '@/routes/admin.routes'

export async function buildApp() {
  const app = Fastify({
    logger: env.APP_ENV !== 'test',
  })

  // ── Plugins ────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: env.APP_URL,
    credentials: true,
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
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

  // ── Health Check ───────────────────────────────────────────────────────
  app.get('/health', async () => ({
    success: true,
    message: 'Cogna API is running',
    timestamp: new Date().toISOString(),
  }))

  return app
}
