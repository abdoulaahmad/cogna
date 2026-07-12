import type { FastifyInstance } from 'fastify'
export default async function orderRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, message: 'order module coming soon', data: [] }))
}
