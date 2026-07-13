import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ProductRepository }  from '@/repositories/product.repository'
import { CategoryRepository } from '@/repositories/category.repository'
import { ProviderRepository } from '@/repositories/provider.repository'
import {
  createProductSchema,
  updateProductSchema,
} from '@/validators/product.validator'
import {
  createCategorySchema,
  updateCategorySchema,
  createProviderSchema,
  updateProviderSchema,
} from '@/validators/admin.validator'
import { successResponse, errorResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'
import { ForbiddenError, NotFoundError } from '@/utils/errors'

/** RBAC guard — allows ADMIN and SUPER_ADMIN only */
async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { role } = req.user as { role: string }
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return reply.status(403).send(errorResponse(new ForbiddenError('Admin access required').message))
  }
}

export default async function adminRoutes(app: FastifyInstance) {

  // All admin routes require authentication + admin role
  app.addHook('onRequest', app.authenticate)
  app.addHook('onRequest', requireAdmin)

  // ─── Products ──────────────────────────────────────────────────────────────

  // GET /api/v1/admin/products
  app.get('/products', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { items, total } = await ProductRepository.findAll({
        page: 1, limit: 100, active: undefined,
      })
      return reply.send(successResponse({ items, total }))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/products
  app.post('/products', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body    = createProductSchema.parse(req.body)
      const product = await ProductRepository.create({
        ...body,
        price:               body.price,
        providerApiOverride: body.providerApiOverride,
      })
      return reply.status(201).send(successResponse(product, 'Product created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // PATCH /api/v1/admin/products/:id
  app.patch('/products/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }  = req.params as { id: string }
      const existing = await ProductRepository.findById(id)
      if (!existing) throw new NotFoundError('Product')
      const body    = updateProductSchema.parse(req.body)
      const product = await ProductRepository.update(id, body)
      return reply.send(successResponse(product, 'Product updated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // DELETE /api/v1/admin/products/:id  (soft delete)
  app.delete('/products/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }  = req.params as { id: string }
      const existing = await ProductRepository.findById(id)
      if (!existing) throw new NotFoundError('Product')
      const product = await ProductRepository.softDelete(id)
      return reply.send(successResponse(product, 'Product deactivated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // ─── Categories ────────────────────────────────────────────────────────────

  // GET /api/v1/admin/categories
  app.get('/categories', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const categories = await CategoryRepository.findAll()
      return reply.send(successResponse(categories))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/categories
  app.post('/categories', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body     = createCategorySchema.parse(req.body)
      const category = await CategoryRepository.create(body)
      return reply.status(201).send(successResponse(category, 'Category created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // PATCH /api/v1/admin/categories/:id
  app.patch('/categories/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }   = req.params as { id: string }
      const existing = await CategoryRepository.findById(id)
      if (!existing) throw new NotFoundError('Category')
      const body     = updateCategorySchema.parse(req.body)
      const category = await CategoryRepository.update(id, body)
      return reply.send(successResponse(category, 'Category updated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // DELETE /api/v1/admin/categories/:id
  app.delete('/categories/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }   = req.params as { id: string }
      const existing = await CategoryRepository.findById(id)
      if (!existing) throw new NotFoundError('Category')
      await CategoryRepository.delete(id)
      return reply.send(successResponse(null, 'Category deleted'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // ─── Providers ─────────────────────────────────────────────────────────────

  // GET /api/v1/admin/providers
  app.get('/providers', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const providers = await ProviderRepository.findAll()
      // Strip sensitive apiKey / apiSecret from response
      const safe = providers.map(({ apiKey: _k, apiSecret: _s, ...rest }) => rest)
      return reply.send(successResponse(safe))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/providers
  app.post('/providers', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body     = createProviderSchema.parse(req.body)
      const provider = await ProviderRepository.create(body)
      const { apiKey: _k, apiSecret: _s, ...safe } = provider
      return reply.status(201).send(successResponse(safe, 'Provider created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // PATCH /api/v1/admin/providers/:id
  app.patch('/providers/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }   = req.params as { id: string }
      const existing = await ProviderRepository.findById(id)
      if (!existing) throw new NotFoundError('Provider')
      const body     = updateProviderSchema.parse(req.body)
      const provider = await ProviderRepository.update(id, body)
      const { apiKey: _k, apiSecret: _s, ...safe } = provider
      return reply.send(successResponse(safe, 'Provider updated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // DELETE /api/v1/admin/providers/:id
  app.delete('/providers/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id }   = req.params as { id: string }
      const existing = await ProviderRepository.findById(id)
      if (!existing) throw new NotFoundError('Provider')
      await ProviderRepository.delete(id)
      return reply.send(successResponse(null, 'Provider deleted'))
    } catch (error) { return handleRouteError(error, reply) }
  })
}
