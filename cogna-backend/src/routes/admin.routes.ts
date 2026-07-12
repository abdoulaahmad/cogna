import type { FastifyInstance } from 'fastify'
export default async function adminRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, message: 'admin module coming soon', data: [] }))
}
