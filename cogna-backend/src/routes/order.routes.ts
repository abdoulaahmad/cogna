import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { OrderService } from '@/services/order.service'
import { createOrderSchema } from '@/validators/order.validator'
import { successResponse, errorResponse, paginatedResponse } from '@/utils/response'
import { AppError } from '@/utils/errors'

async function handleError(error: unknown, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(errorResponse(error.message))
  }
  return reply.status(500).send(errorResponse('Internal server error'))
}

export default async function orderRoutes(app: FastifyInstance) {

  // All order routes require authentication
  app.addHook('onRequest', app.authenticate)

  // POST /api/v1/orders
  app.post('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const body  = createOrderSchema.parse(req.body)
      const order = await OrderService.createOrder(sub, body)
      return reply.status(201).send(successResponse(order, 'Order created'))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // GET /api/v1/orders
  app.get('/', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub } = req.user as { sub: string }
      const { page = 1, limit = 20 } = req.query as { page?: number; limit?: number }
      const { items, total } = await OrderService.listOrders(sub, Number(page), Number(limit))
      return reply.send(paginatedResponse(items, { page: Number(page), limit: Number(limit), total }))
    } catch (error) {
      return handleError(error, reply)
    }
  })

  // GET /api/v1/orders/:id
  app.get('/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sub, role } = req.user as { sub: string; role: string }
      const { id } = req.params as { id: string }
      const order = await OrderService.getOrder(id, sub, role === 'ADMIN' || role === 'SUPER_ADMIN')
      return reply.send(successResponse(order))
    } catch (error) {
      return handleError(error, reply)
    }
  })
}
