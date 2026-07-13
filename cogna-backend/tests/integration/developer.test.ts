import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

vi.mock('@/services/developer.service', () => ({
  DeveloperService: {
    listApiKeys:  vi.fn(),
    createApiKey: vi.fn(),
    revokeApiKey: vi.fn(),
  },
}))

import { DeveloperService } from '@/services/developer.service'

let app: FastifyInstance
let authToken: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  authToken = app.jwt.sign({ sub: 'user-1', role: 'USER' })
})

afterAll(async () => {
  await app.close()
})

const mockKey = {
  id:        'key-1',
  userId:    'user-1',
  name:      'My Test Key',
  keyPrefix: 'cgn_',
  isActive:  true,
  createdAt: new Date('2026-01-01').toISOString(),
  lastUsed:  null,
}

describe('Developer API Integration', () => {

  describe('GET /api/v1/developer/keys', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server).get('/api/v1/developer/keys')
      expect(response.status).toBe(401)
    })

    it('should list API keys for the authenticated user', async () => {
      vi.mocked(DeveloperService.listApiKeys).mockResolvedValueOnce([mockKey])

      const response = await request(app.server)
        .get('/api/v1/developer/keys')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBe('My Test Key')
    })
  })

  describe('POST /api/v1/developer/keys', () => {
    it('should return 401 if unauthenticated', async () => {
      const response = await request(app.server)
        .post('/api/v1/developer/keys')
        .send({ name: 'Test Key' })

      expect(response.status).toBe(401)
    })

    it('should create a new API key', async () => {
      vi.mocked(DeveloperService.createApiKey).mockResolvedValueOnce({
        ...mockKey,
        rawKey: 'cgn_live_abc123xyz',
      })

      const response = await request(app.server)
        .post('/api/v1/developer/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My Test Key' })

      expect(response.status).toBe(201)
      expect(response.body.data.rawKey).toBe('cgn_live_abc123xyz')
    })

    it('should return 400 if name is missing', async () => {
      const response = await request(app.server)
        .post('/api/v1/developer/keys')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/v1/developer/keys/:id', () => {
    it('should revoke an API key', async () => {
      vi.mocked(DeveloperService.revokeApiKey).mockResolvedValueOnce({ ...mockKey, isActive: false })

      const response = await request(app.server)
        .delete('/api/v1/developer/keys/key-1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.isActive).toBe(false)
    })

    it('should return 404 if key not found', async () => {
      const { NotFoundError } = await import('@/utils/errors')
      vi.mocked(DeveloperService.revokeApiKey).mockRejectedValueOnce(new NotFoundError('API Key'))

      const response = await request(app.server)
        .delete('/api/v1/developer/keys/bad-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })
})
