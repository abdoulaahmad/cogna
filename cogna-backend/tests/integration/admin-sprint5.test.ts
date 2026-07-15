import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';
import prisma from '@/config/database';

let app: FastifyInstance;
let superAdminToken: string;
let financeToken: string;
let supportToken: string;
let customerToken: string;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();

  superAdminToken = app.jwt.sign({ sub: 'user-admin', role: 'ADMIN', adminRole: 'SUPER_ADMIN' });
  financeToken = app.jwt.sign({ sub: 'user-finance', role: 'ADMIN', adminRole: 'FINANCE' });
  supportToken = app.jwt.sign({ sub: 'user-support', role: 'ADMIN', adminRole: 'SUPPORT' });
  customerToken = app.jwt.sign({ sub: 'user-customer', role: 'CUSTOMER' });

  // Stub DB calls
  vi.spyOn(prisma.order, 'aggregate').mockResolvedValue({ _sum: { amount: 1500 } } as unknown);
  vi.spyOn(prisma.wallet, 'aggregate').mockResolvedValue({ _sum: { availableBalance: 5000, pendingBalance: 200 } } as unknown);
  vi.spyOn(prisma.walletFunding, 'count').mockResolvedValue(10);
  vi.spyOn(prisma.order, 'groupBy').mockResolvedValue([
    { status: 'COMPLETED', _count: { id: 8 } },
    { status: 'PROCESSING', _count: { id: 2 } },
  ] as unknown);
  vi.spyOn(prisma.user, 'count').mockResolvedValue(3);

  vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as unknown);
  vi.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([
    { id: 'log-1', action: 'WALLET_ADJUSTMENT_APPROVED', createdAt: new Date() }
  ] as unknown);

  vi.spyOn(prisma.apiRequestLog, 'findMany').mockResolvedValue([
    { id: 'api-1', method: 'GET', path: '/api/v1/sandbox/products', statusCode: 200 }
  ] as unknown);

  vi.spyOn(prisma.wallet, 'findUnique').mockResolvedValue({
    id: 'wallet-1',
    userId: 'user-customer',
    availableBalance: 100,
    pendingBalance: 0,
    lifetimeFunded: 100,
    lifetimeSpent: 0,
  } as unknown);

  vi.spyOn(prisma.walletAdjustmentRequest, 'create').mockResolvedValue({
    id: 'request-123',
    walletId: 'wallet-1',
    makerId: 'user-finance',
    amount: 50,
    direction: 'CREDIT',
    status: 'PENDING'
  } as unknown);

  vi.spyOn(prisma.walletAdjustmentRequest, 'findUnique').mockImplementation(({ where }: unknown) => {
    if (where.id === 'request-123') {
      return Promise.resolve({
        id: 'request-123',
        walletId: 'wallet-1',
        makerId: 'user-finance',
        amount: 50,
        direction: 'CREDIT',
        status: 'PENDING'
      } as unknown);
    }
    return Promise.resolve(null);
  });
});

afterAll(async () => {
  await app.close();
});

describe('Sprint 5 Admin Operations & RBAC', () => {
  describe('GET /api/v1/admin/dashboard/metrics', () => {
    it('denies access to non-admin customers', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(403);
    });

    it('grants access to permitted admin roles and returns aggregates', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/dashboard/metrics')
        .set('Authorization', `Bearer ${financeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.gmv).toBe(1500);
      expect(res.body.data.liability).toBe(5200);
    });
  });

  describe('Maker-Checker Wallet Adjustments', () => {
    it('creates adjustment request successfully', async () => {
      const res = await request(app.server)
        .post('/api/v1/admin/wallets/wallet-1/adjustments/request')
        .set('Authorization', `Bearer ${financeToken}`)
        .send({
          amount: 50,
          direction: 'CREDIT',
          reason: 'Test adjustment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
    });

    it('denies adjustment approval if checker is the maker (self-approval boundary)', async () => {
      const res = await request(app.server)
        .post('/api/v1/admin/wallets/adjustments/request-123/approve')
        .set('Authorization', `Bearer ${financeToken}`); // finance token matches makerId

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Makers cannot approve');
    });

    it('allows approval by a different checker role (Maker-Checker validation)', async () => {
      const res = await request(app.server)
        .post('/api/v1/admin/wallets/adjustments/request-123/approve')
        .set('Authorization', `Bearer ${superAdminToken}`); // superAdmin is checker, finance is maker

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('APPROVED');
    });
  });

  describe('Audit & API logs routes', () => {
    it('denies support role from reading audit logs', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${supportToken}`);

      expect(res.status).toBe(403);
    });

    it('allows SUPER_ADMIN to read operational audit trails', async () => {
      const res = await request(app.server)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });
});
