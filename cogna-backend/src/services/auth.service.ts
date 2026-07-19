import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { UserRepository } from '@/repositories/user.repository'
import { RefreshTokenRepository } from '@/repositories/refresh-token.repository'
import { UserCapabilityRepository } from '@/repositories/user-capability.repository'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/utils/errors'
import { env } from '@/config/env'
import type { RegisterInput, LoginInput } from '@/validators/auth.validator'


const BCRYPT_ROUNDS = 12

export const AuthService = {
  // ── Register ─────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
    const existing = await UserRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('An account with this email already exists')

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const user = await UserRepository.create({
      fullName: input.fullName,
      email:    input.email,
      passwordHash,
    })

    return {
      id:       user.id,
      fullName: user.fullName,
      email:    user.email,
      role:     user.role,
      status:   user.status,
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────
  async login(input: LoginInput, signJwt: (payload: object, options?: object) => string) {
    const user = await UserRepository.findByEmail(input.email)
    if (!user) throw new UnauthorizedError('Invalid email or password')

    const validPassword = await bcrypt.compare(input.password, user.passwordHash)
    if (!validPassword) throw new UnauthorizedError('Invalid email or password')

    if (user.status === 'SUSPENDED') throw new UnauthorizedError('Your account has been suspended')

    // Generate tokens
    const accessToken = signJwt(
      { sub: user.id, email: user.email, role: user.role, adminRole: user.adminRole },
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    const refreshToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    await RefreshTokenRepository.create({ userId: user.id, token: refreshToken, expiresAt })

    return {
      accessToken,
      refreshToken,
      user: {
        id:       user.id,
        fullName: user.fullName,
        email:    user.email,
        role:     user.role,
        adminRole: user.adminRole,
      },
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────
  async logout(refreshToken: string) {
    const stored = await RefreshTokenRepository.findByToken(refreshToken)
    if (!stored) throw new UnauthorizedError('Invalid refresh token')
    await RefreshTokenRepository.deleteByToken(refreshToken)
    return { message: 'Logged out successfully' }
  },

  // ── Refresh Token ─────────────────────────────────────────────────────
  async refresh(refreshToken: string, signJwt: (payload: object, options?: object) => string) {
    const stored = await RefreshTokenRepository.findByToken(refreshToken)
    if (!stored) throw new UnauthorizedError('Invalid refresh token')
    if (stored.expiresAt < new Date()) {
      await RefreshTokenRepository.deleteByToken(refreshToken)
      throw new UnauthorizedError('Refresh token expired')
    }

    const user = await UserRepository.findById(stored.userId)
    if (!user) throw new NotFoundError('User')

    // Rotate: delete old, issue new
    await RefreshTokenRepository.deleteByToken(refreshToken)

    const newAccessToken = signJwt(
      { sub: user.id, email: user.email, role: user.role, adminRole: user.adminRole },
      { expiresIn: env.JWT_EXPIRES_IN }
    )
    const newRefreshToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await RefreshTokenRepository.create({ userId: user.id, token: newRefreshToken, expiresAt })

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  },

  // ── Get Me ────────────────────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User')
    const isDeveloper = await UserCapabilityRepository.hasDeveloper(userId)
    return {
      id:            user.id,
      fullName:      user.fullName,
      email:         user.email,
      role:          user.role,
      emailVerified: user.emailVerified,
      status:        user.status,
      isDeveloper,
      createdAt:     user.createdAt,
    }
  },
}
