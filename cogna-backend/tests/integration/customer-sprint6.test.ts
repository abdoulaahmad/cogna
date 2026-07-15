import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';
import prisma from '@/config/database';

let app: FastifyInstance;
let customerToken: string;
let anotherCustomerToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  customerToken = app.jwt.sign({ sub: 'user-customer', role: 'CUSTOMER' });
  anotherCustomerToken = app.jwt.sign({ sub: 'user-hacker', role: 'CUSTOMER' });

  // Stub DB calls
  vi.spyOn(prisma.wallet, 'findUnique').mockResolvedValue({
    id: 'wallet-1',
    userId: 'user-customer',
    availableBalance: 500,
    pendingBalance: 0,
    lifetimeFunded: 500,
    lifetimeSpent: 0
  } as never);

  vi.spyOn(prisma.order, 'count').mockResolvedValue(2);
  vi.spyOn(prisma.order, 'findMany').mockResolvedValue([
    {
      id: 'order-1',
      userId: 'user-customer',
      productId: 'prod-1',
      amount: 100,
      status: 'PENDING',
      createdAt: new Date(),
      product: { name: 'Netflix Premium' }
    }
  ] as never);

  vi.spyOn(prisma.walletTransaction, 'findMany').mockResolvedValue([]);
  vi.spyOn(prisma.orderStatusEvent, 'create').mockResolvedValue({} as never);
  vi.spyOn(prisma.notification, 'create').mockResolvedValue({} as never);

  vi.spyOn(prisma.order, 'findUnique').mockImplementation(async ({ where }: { where: { id?: string; reference?: string } }) => {
    if (where.id === 'order-1') {
      return {
        id: 'order-1',
        userId: 'user-customer',
        productId: 'prod-1',
        amount: 100,
        status: 'PENDING',
        createdAt: new Date(),
        product: { name: 'Netflix Premium', description: 'Monthly sub' },
        payment: null,
        walletTransactions: [{ direction: 'DEBIT', type: 'PURCHASE' }],
        statusEvents: []
      } as never;
    }
    return null;
  });

  vi.spyOn(prisma.supportTicket, 'create').mockResolvedValue({
    id: 'ticket-1',
    userId: 'user-customer',
    subject: 'Refund request',
    status: 'OPEN'
  } as never);

  vi.spyOn(prisma.supportMessage, 'create').mockResolvedValue({} as never);

  vi.spyOn(prisma.supportTicket, 'findMany').mockResolvedValue([
    { id: 'ticket-1', subject: 'Refund request', status: 'OPEN', updatedAt: new Date() }
  ] as never);

  vi.spyOn(prisma.supportTicket, 'count').mockResolvedValue(1);

  vi.spyOn(prisma.supportTicket, 'findUnique').mockImplementation(async ({ where }: { where: { id?: string; reference?: string } }) => {
    if (where.id === 'ticket-1') {
      return {
        id: 'ticket-1',
        userId: 'user-customer',
        subject: 'Refund request',
        status: 'OPEN',
        messages: []
      } as never;
    }
    return null;
  });

  vi.spyOn(prisma.receipt, 'findUnique').mockImplementation(async ({ where }: { where: { id?: string; reference?: string } }) => {
    if (where.reference === 'REC-ORD-123') {
      return {
        id: 'receipt-1',
        reference: 'REC-ORD-123',
        userId: 'user-customer',
        type: 'PURCHASE',
        amount: 100,
        entityId: 'order-1',
        createdAt: new Date(),
        user: { fullName: 'John Customer', email: 'john@cogna.com' }
      } as never;
    }
    return null;
  });

  vi.spyOn(prisma.notificationPreference, 'findUnique').mockResolvedValue({
    userId: 'user-customer',
    emailFunding: true,
    emailPurchase: true
  } as never);

  vi.spyOn(prisma.notificationPreference, 'upsert').mockResolvedValue({
    userId: 'user-customer',
    emailFunding: false,
    emailPurchase: true
  } as never);
});

afterAll(async () => {
  await app.close();
});

describe('Sprint 6 Customer Portal Endpoints', () => {

  describe('GET /api/v1/customer/dashboard', () => {
    it('returns dashboard telemetry for authenticated users', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/dashboard')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wallet.availableBalance).toBe(500);
    });
  });

  describe('GET /api/v1/customer/orders/:id', () => {
    it('denies access if user is not the order owner', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/orders/order-1')
        .set('Authorization', `Bearer ${anotherCustomerToken}`);

      expect(res.status).toBe(403);
    });

    it('returns order details for the owner', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/orders/order-1')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe('order-1');
    });
  });

  describe('POST /api/v1/customer/orders/:id/cancel', () => {
    it('cancels pending order and returns refund confirmation', async () => {
      const res = await request(app.server)
        .post('/api/v1/customer/orders/order-1/cancel')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Support Tickets', () => {
    it('dispatches a new support ticket', async () => {
      const res = await request(app.server)
        .post('/api/v1/customer/support/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ subject: 'Refund Request', message: 'I need a refund for Order-1' });

      expect(res.status).toBe(201);
      expect(res.body.data.subject).toBe('Refund Request');
    });

    it('lists customer support tickets', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/support/tickets')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThan(0);
    });
  });

  describe('Receipts Lookup', () => {
    it('returns printable receipt payload for valid references', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/receipts/REC-ORD-123')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reference).toBe('REC-ORD-123');
    });

    it('denies printable receipt lookup if not owner', async () => {
      const res = await request(app.server)
        .get('/api/v1/customer/receipts/REC-ORD-123')
        .set('Authorization', `Bearer ${anotherCustomerToken}`);

      expect(res.status).toBe(403);
    });
  });
});
