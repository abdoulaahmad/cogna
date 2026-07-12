import type { FastifyInstance } from 'fastify'

// Placeholder — implemented in Week 2
export default async function productRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, message: 'Products module coming soon', data: [] }))
}
