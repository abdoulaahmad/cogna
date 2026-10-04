import crypto from 'crypto'
import type { FastifyInstance } from 'fastify'

export interface MockSecurityUser {
  id: string
  fullName: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  adminRole?: 'SUPER_ADMIN' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | null
  status: 'ACTIVE' | 'SUSPENDED'
}

/**
 * Creates a signed JWT for testing specific authorization roles and scopes
 */
export function generateTestJwt(
  app: FastifyInstance,
  payload: {
    sub: string
    email?: string
    role: 'CUSTOMER' | 'ADMIN'
    adminRole?: 'SUPER_ADMIN' | 'OPERATIONS' | 'FINANCE' | 'SUPPORT' | null
  }
): string {
  return app.jwt.sign({
    sub: payload.sub,
    email: payload.email ?? `${payload.sub}@test.com`,
    role: payload.role,
    adminRole: payload.adminRole ?? null,
  })
}

/**
 * Computes HMAC-SHA512 signature matching Paystack webhook specification
 */
export function signPaystackPayload(payload: string, secretKey: string): string {
  return crypto.createHmac('sha512', secretKey).update(payload).digest('hex')
}

/**
 * Computes HMAC-SHA512 signature matching Monnify webhook specification
 */
export function signMonnifyPayload(payload: string, secretKey: string): string {
  return crypto.createHmac('sha512', secretKey).update(payload).digest('hex')
}

/**
 * Computes HMAC-SHA256 signature matching Provider webhook specification
 */
export function signProviderPayload(payload: string, secretKey: string): string {
  return crypto.createHmac('sha256', secretKey).update(payload).digest('hex')
}

/**
 * Runs a task concurrently `count` times using Promise.all
 */
export async function runConcurrent<T>(
  task: (index: number) => Promise<T>,
  count: number
): Promise<PromiseSettledResult<T>[]> {
  const promises = Array.from({ length: count }, (_, i) => task(i))
  return Promise.allSettled(promises)
}
