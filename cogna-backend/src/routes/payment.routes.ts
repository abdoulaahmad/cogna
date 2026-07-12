import type { FastifyInstance } from 'fastify'
export default async function paymentRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, message: 'payment module coming soon', data: [] }))
}
