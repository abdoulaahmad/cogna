import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'
import { generateTestJwt } from './helpers/security.helper'

let app: FastifyInstance
let userAToken: string
let userBToken: string

// Mock repositories to return isolated tenant records
vi.mock('@/repositories/customer.repository', () => ({
  CustomerRepository: {
    findOrderDetails: vi.fn().mockImplementation(async (id: string) => {
      if (id === 'order-user-b') {
        return {
          id: 'order-user-b',
          userId: 'user-b-id',
          productId: 'prod-1',
          amount: 500,
          currency: 'NGN',
          status: 'PENDING',
          deliveryItems: [],
          product: { name: 'Product B' },
          payment: null,
          walletTransactions: [],
          statusEvents: [],
        }
      }
      return null
    }),
    findReceipt: vi.fn().mockImplementation(async (reference: string) => {
      if (reference === 'REC-USER-B') {
        return {
          id: 'receipt-b',
          reference: 'REC-USER-B',
          userId: 'user-b-id',
          amount: 500,
          currency: 'NGN',
          type: 'PURCHASE',
          user: { email: 'userb@example.com', fullName: 'User B' },
        }
      }
      return null
    }),
    findTicketDetails: vi.fn().mockImplementation(async (id: string) => {
      if (id === 'ticket-user-b') {
        return {
          id: 'ticket-user-b',
          userId: 'user-b-id',
          subject: 'Private Ticket User B',
          status: 'OPEN',
          messages: [],
        }
      }
      return null
    }),
    cancelOrder: vi.fn().mockResolvedValue({ kind: 'FORBIDDEN' }),
    findOrderReceipt: vi.fn().mockResolvedValue(null),
  },
}))

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  userAToken = generateTestJwt(app, { sub: 'user-a-id', role: 'CUSTOMER' })
  userBToken = generateTestJwt(app, { sub: 'user-b-id', role: 'CUSTOMER' })
})

afterAll(async () => {
  await app.close()
})

describe('Security Suite: Multi-Tenant Data Isolation & IDOR Protection', () => {
  describe('Customer Orders IDOR Defenses', () => {
    it('denies User A access to User B order details (404/403 isolation)', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/orders/order-user-b')
        .set('Authorization', `Bearer ${userAToken}`)

      // Must be 404 or 403 to prevent cross-tenant information leakage
      expect([403, 404]).toContain(res.status)
      expect(res.body.success).toBe(false)
    })

    it('allows User B access to their own order details', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/orders/order-user-b')
        .set('Authorization', `Bearer ${userBToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('order-user-b')
    })

    it('denies User A from cancelling User B pending order', async () => {
      const res = await request(app.server)
        .post('/api/v1/customer/orders/order-user-b/cancel')
        .set('Authorization', `Bearer ${userAToken}`)

      expect([403, 404]).toContain(res.status)
      expect(res.body.success).toBe(false)
    })
  })

  describe('Customer Support Tickets IDOR Defenses', () => {
    it('denies User A access to User B support ticket', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/support/tickets/ticket-user-b')
        .set('Authorization', `Bearer ${userAToken}`)

      expect([403, 404]).toContain(res.status)
      expect(res.body.success).toBe(false)
    })

    it('allows User B access to their own support ticket', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/support/tickets/ticket-user-b')
        .set('Authorization', `Bearer ${userBToken}`)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('ticket-user-b')
    })
  })
})
