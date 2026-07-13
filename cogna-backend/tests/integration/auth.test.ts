/**
 * Auth API Integration Tests
 * 
 * Strategy: Mock at the Service layer so the full route/validator/response
 * pipeline is exercised. The mocked service returns typed values exactly as
 * the real service would — giving us route-level coverage without a real DB.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { buildApp } from '@/app'
import type { FastifyInstance } from 'fastify'

// ── Hoist-safe service mocks ───────────────────────────────────────────────
vi.mock('@/services/auth.service', () => ({
  AuthService: {
    register:  vi.fn(),
    login:     vi.fn(),
    logout:    vi.fn(),
    refresh:   vi.fn(),
    getMe:     vi.fn(),
  },
}))

import { AuthService } from '@/services/auth.service'

// ── App lifecycle ──────────────────────────────────────────────────────────
let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

// ── Helpers ────────────────────────────────────────────────────────────────
const mockUser = {
  id:       'user-123',
  fullName: 'Test User',
  email:    'test@example.com',
  role:     'USER' as const,
  status:   'ACTIVE' as const,
}

const mockAuthResult = {
  user:         mockUser,
  accessToken:  'mock.jwt.token',
  refreshToken: 'mock-refresh-token',
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('Auth API Integration', () => {

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return 201 with user data', async () => {
      vi.mocked(AuthService.register).mockResolvedValueOnce(mockUser)

      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({ fullName: 'Test User', email: 'test@example.com', password: 'Password123!' })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('test@example.com')
    })

    it('should return 409 if email already exists', async () => {
      const { ConflictError } = await import('@/utils/errors')
      vi.mocked(AuthService.register).mockRejectedValueOnce(
        new ConflictError('An account with this email already exists')
      )

      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({ fullName: 'Test User', email: 'test@example.com', password: 'Password123!' })

      expect(response.status).toBe(409)
      expect(response.body.success).toBe(false)
    })

    it('should return 400 if body is invalid (missing password)', async () => {
      // Missing fullName and password
      const response = await request(app.server)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' })   // fullName + password missing

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should login a user and return tokens', async () => {
      vi.mocked(AuthService.login).mockResolvedValueOnce(mockAuthResult)

      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.accessToken).toBe('mock.jwt.token')
      expect(response.body.data.user.email).toBe('test@example.com')
    })

    it('should return 401 for invalid credentials', async () => {
      const { UnauthorizedError } = await import('@/utils/errors')
      vi.mocked(AuthService.login).mockRejectedValueOnce(
        new UnauthorizedError('Invalid email or password')
      )

      const response = await request(app.server)
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrongpass' })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens for a valid refresh token', async () => {
      vi.mocked(AuthService.refresh).mockResolvedValueOnce({
        accessToken:  'new.jwt.token',
        refreshToken: 'new-refresh-token',
      })

      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })

      expect(response.status).toBe(200)
      expect(response.body.data.accessToken).toBe('new.jwt.token')
    })

    it('should return 400 if refreshToken is missing', async () => {
      // refreshToken field is required
      const response = await request(app.server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: '' })   // empty string → Zod min(1) fails → 400

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app.server)
        .get('/api/v1/auth/me')

      expect(response.status).toBe(401)
    })

    it('should return user profile with a valid JWT', async () => {
      vi.mocked(AuthService.getMe).mockResolvedValueOnce({
        ...mockUser,
        emailVerified: false,
        createdAt: new Date('2026-01-01'),
      })

      // Sign a JWT in the test
      const token = app.jwt.sign({ sub: 'user-123', role: 'USER' })

      const response = await request(app.server)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data.email).toBe('test@example.com')
    })
  })
})
