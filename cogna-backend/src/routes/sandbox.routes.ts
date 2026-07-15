import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getErrorMessage } from '@/utils/error-message';
import { ForbiddenError } from '@/utils/errors';
import { successResponse } from '@/utils/response';
import prisma from '@/config/database';
import { randomUUID } from 'crypto';

/**
 * Sandbox Simulation Routes
 * Isolated from production data, live providers, gateways, and wallets.
 */
export default async function sandboxRoutes(app: FastifyInstance) {
  // All sandbox routes require API key authentication
  app.addHook('onRequest', app.authenticateApiKey);

  // Assert TEST environment only
  app.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
    if (!req.apiKeyContext || req.apiKeyContext.environment !== 'TEST') {
      throw new ForbiddenError('Sandbox endpoints are only accessible with TEST environment API keys');
    }
  });

  // GET /api/v1/sandbox/products
  app.get(
    '/products',
    {
      schema: {
        description: 'Get sandbox catalog products.',
        tags: ['Sandbox'],
        security: [{ apiKey: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    currency: { type: 'string' },
                    category: { type: 'string' },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_req: FastifyRequest, reply: FastifyReply) => {
      // Return list of mocked sandbox products
      const mockProducts = [
        {
          id: 'sb-prod-chatgpt',
          name: 'ChatGPT Plus (Sandbox)',
          description: 'Simulated ChatGPT Plus subscription access',
          price: 20.0,
          currency: 'USD',
          category: 'AI Chat',
          status: 'ACTIVE',
        },
        {
          id: 'sb-prod-midjourney',
          name: 'Midjourney Pro (Sandbox)',
          description: 'Simulated Midjourney image generation credits',
          price: 30.0,
          currency: 'USD',
          category: 'AI Image',
          status: 'ACTIVE',
        },
      ];
      return reply.send(successResponse(mockProducts));
    }
  );

  // POST /api/v1/sandbox/orders
  app.post(
    '/orders',
    {
      schema: {
        description: 'Simulate order placement in test environment.',
        tags: ['Sandbox'],
        security: [{ apiKey: [] }],
        body: {
          type: 'object',
          required: ['productId', 'customerEmail'],
          properties: {
            productId: { type: 'string' },
            customerEmail: { type: 'string', format: 'email' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  status: { type: 'string' },
                  amount: { type: 'number' },
                  currency: { type: 'string' },
                  customerEmail: { type: 'string' },
                  providerOrderId: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const { productId, customerEmail } = req.body as { productId: string; customerEmail: string };

      // Return simulated completed order directly without hitting wallets or gateways
      const mockOrder = {
        id: `sb-ord-${randomUUID()}`,
        productId,
        status: 'COMPLETED',
        amount: 20.0,
        currency: 'USD',
        customerEmail,
        providerOrderId: `sb-po-${randomUUID()}`,
        createdAt: new Date().toISOString(),
      };

      // Try to dispatch a test webhook asynchronously if endpoint is configured
      const endpoint = await prisma.developerWebhookEndpoint.findFirst({
        where: { userId: req.apiKeyContext!.userId, active: true },
      });

      if (endpoint) {
        // Dispatch test webhook in background
        void (async () => {
          const payload = {
            event_id: `evt-${randomUUID()}`,
            event_type: 'order.completed',
            data: {
              orderId: mockOrder.id,
              status: mockOrder.status,
              amount: mockOrder.amount,
              currency: mockOrder.currency,
              customerEmail: mockOrder.customerEmail,
            },
          };

          try {
            const res = await fetch(endpoint.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Cogna-Signature': 'mock-sandbox-signature',
              },
              body: JSON.stringify(payload),
            });

            const text = await res.text();
            await prisma.developerWebhookDelivery.create({
              data: {
                endpointId: endpoint.id,
                eventId: payload.event_id,
                eventType: payload.event_type,
                payload,
                statusCode: res.status,
                response: text.slice(0, 1000),
                success: res.ok,
              },
            });
          } catch (err: unknown) {
            await prisma.developerWebhookDelivery.create({
              data: {
                endpointId: endpoint.id,
                eventId: payload.event_id,
                eventType: payload.event_type,
                payload,
                statusCode: 0,
                response: `Connection failed: ${getErrorMessage(err)}`,
                success: false,
              },
            });
          }
        })();
      }

      return reply.status(201).send(successResponse(mockOrder, 'Sandbox order successfully created'));
    }
  );
}
