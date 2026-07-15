import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '@/app';
import type { FastifyInstance } from 'fastify';
import prisma from '@/config/database';
import { createHash } from 'crypto';

let app: FastifyInstance;
let authToken: string;
const testRawKey = 'cg_test_abc123';
const testHashedKey = createHash('sha256').update(testRawKey).digest('hex');

// Mock developer-capability checking for auth routes
vi.mock('@/services/developer-capability.service', () => ({
  DeveloperCapabilityService: {
    require: vi.fn().mockResolvedValue(true),
    enable: vi.fn().mockResolvedValue({ id: 'cap-1', type: 'DEVELOPER' }),
  },
}));

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  authToken = app.jwt.sign({ sub: 'user-1', role: 'USER' });

  // Stub dynamic DB queries for apiKey authorization check
  vi.spyOn(prisma.apiKey, 'findUnique').mockImplementation(({ where }: unknown) => {
    if (where.apiKey === testHashedKey) {
      return Promise.resolve({
        id: 'key-123',
        userId: 'user-1',
        name: 'Test Key',
        apiKey: testHashedKey,
        environment: 'TEST',
        scopes: ['read:catalog', 'write:orders'],
        status: 'ACTIVE',
        expiresAt: null,
        user: { id: 'user-1' },
      } as unknown);
    }
    return Promise.resolve(null);
  });

  vi.spyOn(prisma.apiRequestLog, 'create').mockResolvedValue({} as unknown);
  vi.spyOn(prisma.developerWebhookEndpoint, 'findFirst').mockResolvedValue(null);
});

afterAll(async () => {
  await app.close();
});

describe('Sandbox & Webhooks Integration', () => {
  describe('GET /api/v1/sandbox/products', () => {
    it('returns 401 if API key header is missing', async () => {
      const res = await request(app.server).get('/api/v1/sandbox/products');
      expect(res.status).toBe(401);
    });

    it('returns mock products when valid test API key is provided', async () => {
      const res = await request(app.server)
        .get('/api/v1/sandbox/products')
        .set('X-API-Key', testRawKey);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data[0].id).toBe('sb-prod-chatgpt');
    });
  });

  describe('POST /api/v1/sandbox/orders', () => {
    it('simulates order placement isolated from production billing', async () => {
      const res = await request(app.server)
        .post('/api/v1/sandbox/orders')
        .set('X-API-Key', testRawKey)
        .send({
          productId: 'sb-prod-chatgpt',
          customerEmail: 'test-sandbox@cogna.store',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.customerEmail).toBe('test-sandbox@cogna.store');
    });
  });

  describe('POST /api/v1/auth/developer/enable', () => {
    it('allows a user to enable developer capability', async () => {
      const res = await request(app.server)
        .post('/api/v1/auth/developer/enable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('DEVELOPER');
    });
  });
});
