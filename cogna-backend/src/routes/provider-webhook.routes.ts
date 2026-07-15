import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ProviderWebhookService } from '@/services/provider-webhook.service';

export default async function providerWebhookRoutes(app: FastifyInstance) {
  app.post(
    '/:providerId/webhooks',
    {
      config: { rawBody: true },
      schema: {
        description: 'Handles status updates and event notifications from third-party resellers.',
        tags: ['Fulfillment'],
        params: {
          type: 'object',
          required: ['providerId'],
          properties: {
            providerId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              eventId: { type: 'string' },
              orderId: { type: 'string' },
              status: { type: 'string' },
            },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Params: { providerId: string } }>, reply: FastifyReply) => {
      // Fastify raw-body plugin exposes req.rawBody as a string/Buffer
      const rawBodyString = req.rawBody;
      if (!rawBodyString) {
        return reply.status(400).send({
          success: false,
          message: 'Missing raw request body',
        });
      }

      const rawBodyBuffer = Buffer.from(rawBodyString);
      const headers = req.headers;

      const result = await ProviderWebhookService.processWebhook(
        req.params.providerId,
        rawBodyBuffer,
        headers
      );

      return reply.send(result);
    }
  );
}
