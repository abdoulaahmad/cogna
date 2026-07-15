import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

vi.mock('@/services/wallet.service', () => ({ WalletService: { initializeFunding: vi.fn() } }))
import { WalletService } from '@/services/wallet.service'

let app: FastifyInstance
let token: string
beforeAll(async () => { app = await buildApp(); await app.ready(); token = app.jwt.sign({ sub: 'user-1', email: 'user@test.com', role: 'CUSTOMER' }) })
afterAll(async () => app.close())

describe('Wallet API', () => {
  it('requires authentication to initialize funding', async () => {
    expect((await request(app.server).post('/api/v1/wallet/fund').send({})).status).toBe(401)
  })
  it('initializes an authenticated wallet funding intent', async () => {
    vi.mocked(WalletService.initializeFunding).mockResolvedValueOnce({ reference: 'wallet_ref', authorizationUrl: 'https://checkout.test' })
    const response = await request(app.server).post('/api/v1/wallet/fund').set('Authorization', `Bearer ${token}`).send({ amount: 500, currency: 'NGN', gateway: 'PAYSTACK', idempotencyKey: '1234567890abcdef' })
    expect(response.status).toBe(201)
    expect(response.body.data.reference).toBe('wallet_ref')
    expect(vi.mocked(WalletService.initializeFunding)).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', amount: 500 }))
  })
})