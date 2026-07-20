import type { FastifyReply } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '@/utils/errors'
import { errorResponse } from '@/utils/response'

/**
 * Centralized route error handler.
 * Handles ZodError → 400, AppError → mapped status, anything else → 500.
 * NOTE: Zod v4 uses `error.issues`; `error.errors` is a deprecated alias that may be undefined.
 */
export async function handleRouteError(error: unknown, reply: FastifyReply) {
  if (error instanceof ZodError) {
    const issues = error.issues ?? (error as { errors?: typeof error.issues }).errors ?? []
    return reply.status(400).send(
      errorResponse('Validation failed', issues.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      })))
    )
  }
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message, error.errors))
  }
  console.error('[500 Internal Server Error]:', error);
  return reply.status(500).send(errorResponse('Internal server error'))
}
