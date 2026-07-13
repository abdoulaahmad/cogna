import 'fastify'
import type { JWT } from '@fastify/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    /** Authenticate a request using the JWT Bearer token */
    authenticate: (
      request: import('fastify').FastifyRequest,
      reply:   import('fastify').FastifyReply
    ) => Promise<void>
    jwt: JWT
  }

  interface FastifyRequest {
    /** Decoded JWT payload (set after authenticate hook runs) */
    user: {
      sub:  string
      role: string
      iat?: number
      exp?: number
    }
  }
}
