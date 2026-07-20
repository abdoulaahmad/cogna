import 'fastify'
import type { JWT } from '@fastify/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    /** Authenticate a request using the JWT Bearer token */
    authenticate: (
      request: import('fastify').FastifyRequest,
      reply:   import('fastify').FastifyReply
    ) => Promise<void>
    /** Authenticate a developer request using X-API-Key header */
    authenticateApiKey: (
      request: import('fastify').FastifyRequest,
      reply:   import('fastify').FastifyReply
    ) => Promise<void>
    /** Authenticate using either JWT or X-API-Key */
    authenticateAny: (
      request: import('fastify').FastifyRequest,
      reply:   import('fastify').FastifyReply
    ) => Promise<void>
    /** Enforce admin role permission boundaries */
    requireAdminRole: (
      allowedRoles: import('@prisma/client').AdminRole[]
    ) => (
      request: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply
    ) => Promise<void>
    jwt: JWT
  }

  interface FastifyRequest {
    /** Decoded JWT payload (set after authenticate hook runs) */
    user: {
      sub:  string
      role: string
      adminRole?: import('@prisma/client').AdminRole | null
      iat?: number
      exp?: number
    }
    /** API key context populated after API Key authentication */
    apiKeyContext?: {
      id: string
      userId: string
      environment: 'TEST' | 'LIVE'
      scopes: string[]
    }
    /** Request start timestamp for API logging */
    startTime?: number
  }
}
