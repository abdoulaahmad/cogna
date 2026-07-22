import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ProductRepository }  from '@/repositories/product.repository'
import { CategoryRepository } from '@/repositories/category.repository'
import { ProviderRepository } from '@/repositories/provider.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { FulfillmentService } from '@/services/fulfillment.service'
import { fulfillmentQueue } from '@/queue/fulfillment.queue'
import prisma from '@/config/database'
import { z } from 'zod'
import {
  createProductSchema,
  updateProductSchema,
  reorderProductsSchema,
} from '@/validators/product.validator'
import {
  createCategorySchema,
  updateCategorySchema,
  createProviderSchema,
  updateProviderSchema,
} from '@/validators/admin.validator'
import { successResponse, errorResponse } from '@/utils/response'
import { handleRouteError } from '@/utils/handle-error'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/utils/errors'
import { AuditLogService } from '@/services/audit-log.service'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { updatePaystackConfigurationSchema } from '@/validators/payment-gateway-configuration.validator'
import { AdminRole } from '@prisma/client'

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
      const { items, total } = await ProductRepository.findAllAdmin()
      return reply.send(successResponse({ items, total }))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/products
  app.post('/products', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = createProductSchema.parse(req.body)
      // Auto-assign position to end of list if not explicitly provided
      const position = body.position !== undefined
        ? body.position
        : await ProductRepository.getNextPosition()
      const product = await ProductRepository.create({
        ...body,
        position,
        price:               body.price,
        providerApiOverride: body.providerApiOverride,
      })
      return reply.status(201).send(successResponse(product, 'Product created'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // PATCH /api/v1/admin/products/reorder
  app.patch('/products/reorder', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { items } = reorderProductsSchema.parse(req.body)
      await ProductRepository.reorderBatch(items)
      return reply.send(successResponse(null, 'Product display positions updated'))
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

  // ─── Orders Fulfillment ───────────────────────────────────────────────────

  // GET /api/v1/admin/orders
  app.get('/orders', async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true } },
          user: { select: { email: true } },
        },
      })
      return reply.send(successResponse(orders))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/orders/:id/refresh-fulfillment
  app.post('/orders/:id/refresh-fulfillment', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const order = await FulfillmentService.refreshStatus(id)
      return reply.send(successResponse(order, 'Fulfillment status refreshed'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/orders/:id/retry-fulfillment
  app.post('/orders/:id/retry-fulfillment', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const order = await OrderRepository.findById(id)
      if (!order) throw new NotFoundError('Order')
      if (order.status === 'COMPLETED') throw new ConflictError('Completed orders cannot be retried')

      await OrderRepository.updateStatus(id, 'PROCESSING')
      await fulfillmentQueue.add('fulfill-order', {
        orderId: id,
        productId: order.productId,
        userId: order.userId,
      }, { jobId: `fulfillment-retry:${id}:${Date.now()}` })

      return reply.status(202).send(successResponse({ orderId: id }, 'Fulfillment retry queued'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // POST /api/v1/admin/orders/:id/cancel-fulfillment
  app.post('/orders/:id/cancel-fulfillment', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const order = await FulfillmentService.cancelOrder(id)
      return reply.send(successResponse(order, 'Fulfillment order cancelled'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // GET /api/v1/admin/providers/:id/health
  app.get('/providers/:id/health', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const health = await FulfillmentService.checkProviderHealth(id)
      return reply.send(successResponse(health, 'Provider health check complete'))
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

  // Payment gateway configuration
  app.get('/payment-gateways/paystack', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.OPERATIONS, AdminRole.FINANCE])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const configuration = await PaymentGatewayConfigurationService.getPaystackStatus()
      return reply.send(successResponse(configuration))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.put('/payment-gateways/paystack', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN])
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const input = updatePaystackConfigurationSchema.parse(req.body)
      const before = await PaymentGatewayConfigurationService.getPaystackStatus()
      const configuration = await PaymentGatewayConfigurationService.updatePaystack(input)
      const { sub } = req.user as { sub: string }

      await AuditLogService.recordAuditEvent(sub, 'PAYMENT_GATEWAY_CONFIGURATION_UPDATE', 'payment_gateway_configurations', 'PAYSTACK', req.ip, {
        reason: 'Paystack configuration updated through the admin portal',
        beforeSnapshot: before,
        afterSnapshot: configuration,
      })

      return reply.send(successResponse(configuration, 'Paystack configuration updated'))
    } catch (error) { return handleRouteError(error, reply) }
  })
  // ─── Admin Dashboard Metrics ───────────────────────────────────────────────
  app.get('/dashboard/metrics', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.OPERATIONS, AdminRole.SUPPORT, AdminRole.FINANCE])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Calculate GMV (Sum of COMPLETED orders)
      const gmvResult = await prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
      const gmv = Number(gmvResult._sum.amount || 0)

      // Calculate Wallet Liabilities (Sum of all wallet balances)
      const liabilityResult = await prisma.wallet.aggregate({
        _sum: { availableBalance: true, pendingBalance: true }
      })
      const liability = Number(liabilityResult._sum.availableBalance || 0) + Number(liabilityResult._sum.pendingBalance || 0)

      // Calculate Funding Success Rate
      const totalFundings = await prisma.walletFunding.count()
      const completedFundings = await prisma.walletFunding.count({
        where: { status: 'COMPLETED' }
      })
      const successRate = totalFundings > 0 ? (completedFundings / totalFundings) * 100 : 100

      // Order counts by status
      const ordersGroup = await prisma.order.groupBy({
        by: ['status'],
        _count: { id: true }
      })
      const orderCounts = ordersGroup.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id
        return acc
      }, {} as Record<string, number>)

      // Support backlog (open support tickets)
      const supportBacklog = await prisma.supportTicket.count({
        where: { status: 'OPEN' }
      })

      return reply.send(successResponse({
        gmv,
        liability,
        fundingSuccessRate: Number(successRate.toFixed(2)),
        orderCounts,
        supportBacklog
      }))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // ─── Users & Capabilities Management ───────────────────────────────────────
  app.get('/users', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          capabilities: true,
          wallet: true
        }
      })
      // Map response to exclude password hashes
      const safe = users.map(({ passwordHash: _p, ...rest }) => rest)
      return reply.send(successResponse(safe))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.post('/users/:id/role', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN])
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const { adminRole, status } = req.body as { adminRole?: AdminRole; status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING' }

      const existing = await prisma.user.findUnique({ where: { id } })
      if (!existing) throw new NotFoundError('User')

      const updated = await prisma.user.update({
        where: { id },
        data: {
          adminRole: adminRole || null,
          role: adminRole ? 'ADMIN' : 'CUSTOMER',
          status: status || undefined
        }
      })

      // Log event
      const { sub } = req.user as { sub: string }
      await AuditLogService.recordAuditEvent(sub, 'USER_ROLE_UPDATE', 'users', id, req.ip, {
        reason: 'Administrative role allocation update',
        beforeSnapshot: { role: existing.role, adminRole: existing.adminRole, status: existing.status },
        afterSnapshot: { role: updated.role, adminRole: updated.adminRole, status: updated.status }
      })

      const { passwordHash: _p, ...safe } = updated
      return reply.send(successResponse(safe, 'User updated successfully'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // ─── Maker-Checker Wallet Adjustments ──────────────────────────────────────
  app.get('/wallets', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.FINANCE])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const wallets = await prisma.wallet.findMany({
        include: { user: { select: { email: true, fullName: true } } }
      })
      return reply.send(successResponse(wallets))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.get('/wallets/adjustments', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.FINANCE])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const requests = await prisma.walletAdjustmentRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: { include: { user: { select: { email: true } } } },
          maker: { select: { email: true } },
          checker: { select: { email: true } }
        }
      })
      return reply.send(successResponse(requests))
    } catch (error) { return handleRouteError(error, reply) }
  })

  const walletAdjustmentRequestSchema = z.object({
    amount: z.number({ error: 'amount must be a positive number' }).positive('amount must be greater than 0'),
    direction: z.enum(['CREDIT', 'DEBIT'] as const),
    reason: z.string().min(5, 'reason must be at least 5 characters'),
  })

  app.post('/wallets/:id/adjustments/request', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.FINANCE, AdminRole.OPERATIONS])
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = req.params as { id: string }
      const body = walletAdjustmentRequestSchema.parse(req.body)

      const wallet = await prisma.wallet.findUnique({ where: { id } })
      if (!wallet) throw new NotFoundError('Wallet')

      const { sub } = req.user as { sub: string }
      const request = await prisma.walletAdjustmentRequest.create({
        data: {
          walletId: id,
          makerId: sub,
          amount: body.amount,
          direction: body.direction,
          reason: body.reason,
          status: 'PENDING'
        }
      })

      await AuditLogService.recordAuditEvent(sub, 'WALLET_ADJUSTMENT_REQUESTED', 'wallet_adjustment_requests', request.id, req.ip, {
        reason: `Initiated adjustment request of ${body.direction} ${body.amount}`,
        requestState: 'PENDING'
      })

      return reply.status(201).send(successResponse(request, 'Adjustment request initiated'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.post('/wallets/adjustments/:requestId/approve', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.FINANCE])
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requestId } = req.params as { requestId: string }
      const { sub } = req.user as { sub: string }

      const request = await prisma.walletAdjustmentRequest.findUnique({
        where: { id: requestId },
        include: { wallet: true }
      })

      if (!request) throw new NotFoundError('Adjustment request')
      if (request.status !== 'PENDING') throw new ConflictError('Request is already processed')
      if (request.makerId === sub) throw new ForbiddenError('Makers cannot approve their own adjustment requests')

      // Perform atomic database transaction for balance update and ledger entry
      const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({ where: { id: request.walletId } })
        if (!wallet) throw new NotFoundError('Wallet')

        const balanceBefore = wallet.availableBalance
        const balanceAfter = request.direction === 'CREDIT'
          ? balanceBefore.add(request.amount)
          : balanceBefore.sub(request.amount)
        if (balanceAfter.lessThan(0)) throw new ValidationError('Adjustment would result in negative wallet balance')

        // 1. Create the Wallet Transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: request.walletId,
            type: 'ADJUSTMENT',
            direction: request.direction,
            amount: request.amount,
            balanceBefore,
            balanceAfter,
            reference: `ADJ-${requestId}`,
            idempotencyKey: `idemp-adj-${requestId}`,
            source: 'ADMIN_MANUAL'
          }
        })

        // 2. Update the Wallet
        await tx.wallet.update({
          where: { id: request.walletId },
          data: {
            availableBalance: balanceAfter,
            lifetimeFunded: request.direction === 'CREDIT' ? wallet.lifetimeFunded.add(request.amount) : undefined,
            lifetimeSpent: request.direction === 'DEBIT' ? wallet.lifetimeSpent.add(request.amount) : undefined
          }
        })

        // 3. Mark the Request as Approved
        const approvedRequest = await tx.walletAdjustmentRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            checkerId: sub
          }
        })

        return { transaction, approvedRequest, balanceBefore, balanceAfter }
      })

      await AuditLogService.recordAuditEvent(sub, 'WALLET_ADJUSTMENT_APPROVED', 'wallets', request.walletId, req.ip, {
        reason: `Approved adjustment request ${requestId}`,
        beforeSnapshot: { availableBalance: Number(result.balanceBefore) },
        afterSnapshot: { availableBalance: Number(result.balanceAfter) },
        approvalState: 'APPROVED'
      })

      return reply.send(successResponse(result.approvedRequest, 'Adjustment approved and applied'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.post('/wallets/adjustments/:requestId/reject', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.FINANCE])
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { requestId } = req.params as { requestId: string }
      const { sub } = req.user as { sub: string }

      const request = await prisma.walletAdjustmentRequest.findUnique({
        where: { id: requestId }
      })

      if (!request) throw new NotFoundError('Adjustment request')
      if (request.status !== 'PENDING') throw new ConflictError('Request is already processed')

      const updated = await prisma.walletAdjustmentRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          checkerId: sub
        }
      })

      await AuditLogService.recordAuditEvent(sub, 'WALLET_ADJUSTMENT_REJECTED', 'wallet_adjustment_requests', requestId, req.ip, {
        reason: 'Adjustment request rejected by checker',
        approvalState: 'REJECTED'
      })

      return reply.send(successResponse(updated, 'Adjustment request rejected'))
    } catch (error) { return handleRouteError(error, reply) }
  })

  // ─── Audit Trails & System Logs ────────────────────────────────────────────
  app.get('/audit-logs', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } }
      })
      return reply.send(successResponse(logs))
    } catch (error) { return handleRouteError(error, reply) }
  })

  app.get('/api-logs', {
    preHandler: app.requireAdminRole([AdminRole.SUPER_ADMIN, AdminRole.ADMIN])
  }, async (_req: FastifyRequest, reply: FastifyReply) => {
    try {
      const logs = await prisma.apiRequestLog.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
        take: 100
      })
      return reply.send(successResponse(logs))
    } catch (error) { return handleRouteError(error, reply) }
  })
}
