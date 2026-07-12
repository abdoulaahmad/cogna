import type { FastifyInstance } from 'fastify'
export default async function developerRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, message: 'developer module coming soon', data: [] }))
}
