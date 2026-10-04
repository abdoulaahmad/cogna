import { getErrorMessage } from '@/utils/error-message';
import { createHash } from 'crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import prisma from '@/config/database';
import { UnauthorizedError, ForbiddenError } from '@/utils/errors';

export default fp(async function apiKeyAuthPlugin(app: FastifyInstance) {
  // Decorate fastify request with a startTime hook if not set
  app.addHook('onRequest', async (req: FastifyRequest) => {
    req.startTime = Date.now();
  });

  // API Key Authentication Decorator
  app.decorate('authenticateApiKey', async (req: FastifyRequest) => {
    const rawKey = req.headers['x-api-key'] as string;
    if (!rawKey) {
      throw new UnauthorizedError('API key is missing in X-API-Key header');
    }

    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    const keyRecord = await prisma.apiKey.findUnique({
      where: { apiKey: hashedKey },
      include: { user: true },
    });

    if (!keyRecord || keyRecord.status !== 'ACTIVE') {
      throw new UnauthorizedError('Invalid or inactive API key');
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      throw new UnauthorizedError('API key has expired');
    }

    let parsedScopes: string[] = []
    try {
      parsedScopes = typeof keyRecord.scopes === 'string' ? JSON.parse(keyRecord.scopes) : (keyRecord.scopes ?? [])
    } catch {
      parsedScopes = []
    }

    // Attach key context metadata to request
    req.apiKeyContext = {
      id: keyRecord.id,
      userId: keyRecord.userId,
      environment: keyRecord.environment,
      scopes: parsedScopes,
    };
  });

  // Require API key scope preHandler
  app.decorate('requireScope', (requiredScope: string) => {
    return async (req: FastifyRequest) => {
      if (req.apiKeyContext) {
        const scopes = req.apiKeyContext.scopes || []
        const hasScope =
          scopes.includes('*') ||
          scopes.includes(requiredScope) ||
          (requiredScope === 'write:orders' && scopes.includes('orders:write')) ||
          (requiredScope === 'read:orders' && scopes.includes('orders:read'))
        if (!hasScope) {
          throw new ForbiddenError(`API key lacks required scope: ${requiredScope}`)
        }
      }
    }
  })

  // onResponse Hook: Log API requests with latency
  app.addHook('onResponse', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.apiKeyContext) {
      const start = req.startTime ?? Date.now();
      const latencyMs = Date.now() - start;

      try {
        await prisma.apiRequestLog.create({
          data: {
            apiKeyId: req.apiKeyContext.id,
            userId: req.apiKeyContext.userId,
            method: req.method,
            path: req.url,
            statusCode: reply.statusCode,
            latencyMs,
            ipAddress: req.ip,
            errorMessage: reply.statusCode >= 400 ? 'Request returned an error' : null,
          },
        });
      } catch (err: unknown) {
        console.error('[api-key-auth-plugin] Failed to write api request log:', getErrorMessage(err));
      }
    }
  });
});
