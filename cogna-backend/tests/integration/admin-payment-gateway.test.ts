import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '@/app'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { AuditLogService } from '@/services/audit-log.service'

vi.mock('@/services/payment-gateway-configuration.service', () => ({
  PaymentGatewayConfigurationService: {
    getPaystackStatus: vi.fn(),
    updatePaystack: vi.fn(),
  },
}))
vi.mock('@/services/audit-log.service', () => ({ AuditLogService: { recordAuditEvent: vi.fn() } }))

const status = {
  gateway: 'PAYSTACK' as const, configured: true, enabled: true,
  source: 'ENVIRONMENT' as const, mode: 'TEST' as const,
  publicKey: 'pk_test••••1234', secretKey: 'sk_test••••5678',
  webhookPath: '/api/v1/payments/webhook/paystack', updatedAt: null,
}

let app: FastifyInstance
let superAdminToken: string
let operationsToken: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  superAdminToken = app.jwt.sign({ sub: 'admin-1', role: 'ADMIN', adminRole: 'SUPER_ADMIN' })
  operationsToken = app.jwt.sign({ sub: 'ops-1', role: 'ADMIN', adminRole: 'OPERATIONS' })
})

afterAll(async () => app.close())
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(PaymentGatewayConfigurationService.getPaystackStatus).mockResolvedValue(status)
  vi.mocked(PaymentGatewayConfigurationService.updatePaystack).mockResolvedValue({ ...status, source: 'ADMIN_PORTAL' })
})

describe('Admin Paystack configuration API', () => {
  it('allows the admin portal to preflight Paystack updates', async () => {
    const response = await request(app.server)
      .options('/api/v1/admin/payment-gateways/paystack')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'PUT')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-methods']).toContain('PUT')
  })

  it('returns masked Paystack readiness to an authorized operator', async () => {
    const response = await request(app.server)
      .get('/api/v1/admin/payment-gateways/paystack')
      .set('Authorization', `Bearer ${operationsToken}`)

    expect(response.status).toBe(200)
    expect(response.body.data.secretKey).toBe('sk_test••••5678')
    expect(response.body.data.webhookPath).toBe('/api/v1/payments/webhook/paystack')
  })

  it('allows only a super admin to update Paystack keys and records an audit event', async () => {
    const response = await request(app.server)
      .put('/api/v1/admin/payment-gateways/paystack')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ publicKey: 'pk_test_abc123', secretKey: 'sk_test_abc123', enabled: true })

    expect(response.status).toBe(200)
    expect(PaymentGatewayConfigurationService.updatePaystack).toHaveBeenCalledWith({
      publicKey: 'pk_test_abc123', secretKey: 'sk_test_abc123', enabled: true,
    })
    expect(AuditLogService.recordAuditEvent).toHaveBeenCalledOnce()
  })

  it('rejects gateway updates from non-super-admin operators', async () => {
    const response = await request(app.server)
      .put('/api/v1/admin/payment-gateways/paystack')
      .set('Authorization', `Bearer ${operationsToken}`)
      .send({ enabled: false })

    expect(response.status).toBe(403)
    expect(PaymentGatewayConfigurationService.updatePaystack).not.toHaveBeenCalled()
  })
})