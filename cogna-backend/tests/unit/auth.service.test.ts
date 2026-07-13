import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthService } from '@/services/auth.service'
import { UserRepository } from '@/repositories/user.repository'
import { RefreshTokenRepository } from '@/repositories/refresh-token.repository'
import { ConflictError, UnauthorizedError } from '@/utils/errors'
import bcrypt from 'bcryptjs'


// ── Mock dependencies ────────────────────────────────────────────────────
vi.mock('@/repositories/user.repository')
vi.mock('@/repositories/refresh-token.repository')
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('$2a$12$mockedhash')),
    compare: vi.fn(() => Promise.resolve(true)),
  }
}))

const mockSignJwt = vi.fn(() => 'mock.jwt.token')

const mockUser = {
  id:           'user-uuid-1',
  fullName:     'Test User',
  email:        'test@example.com',
  passwordHash: '$2a$12$hashedpassword',
  role:         'CUSTOMER' as const,
  status:       'ACTIVE' as const,
  emailVerified: false,
  createdAt:    new Date(),
  updatedAt:    new Date(),
}

// ════════════════════════════════════════════════════════════════════════
describe('AuthService', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── register ──────────────────────────────────────────────────────────
  describe('register', () => {
    it('should create a new user and return safe user data', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(UserRepository.create).mockResolvedValue(mockUser)

      const result = await AuthService.register({
        fullName: 'Test User',
        email:    'test@example.com',
        password: 'Password123',
      })

      expect(result).toMatchObject({
        id:       mockUser.id,
        fullName: mockUser.fullName,
        email:    mockUser.email,
        role:     'CUSTOMER',
      })
      // Must NOT expose passwordHash
      expect(result).not.toHaveProperty('passwordHash')
    })

    it('should throw ConflictError if email already exists', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(mockUser)

      await expect(
        AuthService.register({
          fullName: 'Duplicate',
          email:    'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow(ConflictError)
    })

    it('should call UserRepository.create with a hashed password (not plaintext)', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(null)
      vi.mocked(UserRepository.create).mockResolvedValue(mockUser)

      await AuthService.register({
        fullName: 'Test User',
        email:    'test@example.com',
        password: 'Password123',
      })

      const createCall = vi.mocked(UserRepository.create).mock.calls[0][0]
      expect(createCall.passwordHash).not.toBe('Password123')
      expect(createCall.passwordHash).toMatch(/^\$2[ab]\$/)
    })
  })

  // ── login ─────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should return accessToken, refreshToken, and user on valid credentials', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue({
        ...mockUser,
        passwordHash: '$2a$12$mockedhash',
      })
      vi.mocked(RefreshTokenRepository.create).mockResolvedValue({
        id:        'rt-uuid',
        userId:    mockUser.id,
        token:     'refresh-token',
        expiresAt: new Date(),
        createdAt: new Date(),
      })

      const result = await AuthService.login(
        { email: 'test@example.com', password: 'Password123' },
        mockSignJwt
      )

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw UnauthorizedError if email not found', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(null)

      await expect(
        AuthService.login({ email: 'nobody@example.com', password: 'Password123' }, mockSignJwt)
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError if password is wrong', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue(mockUser)
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false)

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'WrongPass999' }, mockSignJwt)
      ).rejects.toThrow(UnauthorizedError)
    })

    it('should throw UnauthorizedError if account is SUSPENDED', async () => {
      vi.mocked(UserRepository.findByEmail).mockResolvedValue({
        ...mockUser,
        status: 'SUSPENDED',
      })

      await expect(
        AuthService.login({ email: 'test@example.com', password: 'Password123' }, mockSignJwt)
      ).rejects.toThrow(UnauthorizedError)
    })
  })

  // ── logout ────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      vi.mocked(RefreshTokenRepository.findByToken).mockResolvedValue({
        id:        'rt-1',
        userId:    mockUser.id,
        token:     'valid-refresh-token',
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      })
      vi.mocked(RefreshTokenRepository.deleteByToken).mockResolvedValue(undefined)

      const result = await AuthService.logout('valid-refresh-token')

      expect(RefreshTokenRepository.deleteByToken).toHaveBeenCalledWith('valid-refresh-token')
      expect(result.message).toContain('Logged out')
    })

    it('should throw UnauthorizedError if refresh token is invalid', async () => {
      vi.mocked(RefreshTokenRepository.findByToken).mockResolvedValue(null)

      await expect(AuthService.logout('invalid-token')).rejects.toThrow(UnauthorizedError)
    })
  })

  // ── getMe ─────────────────────────────────────────────────────────────
  describe('getMe', () => {
    it('should return user profile without passwordHash', async () => {
      vi.mocked(UserRepository.findById).mockResolvedValue(mockUser)

      const result = await AuthService.getMe(mockUser.id)

      expect(result.email).toBe(mockUser.email)
      expect(result).not.toHaveProperty('passwordHash')
    })

    it('should throw NotFoundError if user does not exist', async () => {
      vi.mocked(UserRepository.findById).mockResolvedValue(null)

      const { NotFoundError } = await import('@/utils/errors')
      await expect(AuthService.getMe('nonexistent-id')).rejects.toThrow(NotFoundError)
    })
  })
})
