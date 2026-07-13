import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ProductService } from '@/services/product.service'
import { listProductsSchema } from '@/validators/product.validator'
import { successResponse, errorResponse, paginatedResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'

export default async function productRoutes(app: FastifyInstance) {

  // GET /api/v1/products
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = listProductsSchema.parse(req.query)
      const { items, total, page, limit } = await ProductService.listProducts(query)
      return reply.send(paginatedResponse(items, { page, limit, total }))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // GET /api/v1/products/search
  app.get('/search', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { q } = req.query as { q?: string }
      const products = await ProductService.searchProducts(q ?? '')
      return reply.send(successResponse(products))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // GET /api/v1/products/category/:slug
  app.get('/category/:slug', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { slug } = req.params as { slug: string }
      const products = await ProductService.getProductsByCategory(slug)
      return reply.send(successResponse(products))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })

  // GET /api/v1/products/:id
  app.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const product = await ProductService.getProductById(id)
      return reply.send(successResponse(product))
    } catch (error) {
      return handleRouteError(error, reply)
    }
  })
}
