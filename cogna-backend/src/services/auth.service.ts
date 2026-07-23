import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { UserRepository } from '@/repositories/user.repository'
import { RefreshTokenRepository } from '@/repositories/refresh-token.repository'
import { UserCapabilityRepository } from '@/repositories/user-capability.repository'
import { ConflictError, NotFoundError, UnauthorizedError } from '@/utils/errors'
import { env } from '@/config/env'
import type { RegisterInput, LoginInput, ResetPasswordInput } from '@/validators/auth.validator'
import { VerificationTokenService } from '@/services/verification-token.service'
import { EmailService } from '@/services/email.service'

const BCRYPT_ROUNDS = 12

export const AuthService = {
  // ── Register ─────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
    const existing = await UserRepository.findByEmail(input.email)
    if (existing) throw new ConflictError('An account with this email already exists')

    const passwordHash       = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const transactionPinHash = await bcrypt.hash(input.transactionPin, BCRYPT_ROUNDS)

    const user = await UserRepository.create({
      fullName: input.fullName,
      email:    input.email,
      passwordHash,
      transactionPinHash,
    })

    // Generate email verification token and send email
    const token = await VerificationTokenService.createToken(user.id, 'EMAIL_VERIFICATION')
    await EmailService.sendVerificationEmail(user.email, token)

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

    if (!user.emailVerified) throw new UnauthorizedError('Please verify your email address before logging in')
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

    // We do NOT rotate the refresh token here to prevent multi-tab concurrency issues 
    // where one tab deletes the token while another is trying to use it.
    // The refresh token remains valid until its original expiration (7 days).

    const newAccessToken = signJwt(
      { sub: user.id, email: user.email, role: user.role, adminRole: user.adminRole },
      { expiresIn: env.JWT_EXPIRES_IN }
    )

    return { accessToken: newAccessToken, refreshToken }
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

  // ── Forgot Password ───────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      // Return success anyway to prevent email enumeration
      return { message: 'If that email exists, a password reset link has been sent' }
    }
    const token = await VerificationTokenService.createToken(user.id, 'PASSWORD_RESET')
    await EmailService.sendPasswordResetEmail(user.email, token)
    return { message: 'If that email exists, a password reset link has been sent' }
  },

  // ── Reset Password ────────────────────────────────────────────────────
  async resetPassword(input: ResetPasswordInput) {
    const userId = await VerificationTokenService.consumeToken(input.token, 'PASSWORD_RESET')
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    await UserRepository.updatePassword(userId, passwordHash)
    
    // Also mark the email as verified since they proved ownership
    const user = await UserRepository.findById(userId)
    if (user && !user.emailVerified) {
      await UserRepository.markEmailVerified(userId)
    }
    return { message: 'Password has been successfully reset' }
  },

  // ── Resend Verification ───────────────────────────────────────────────
  async resendVerification(email: string) {
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      return { message: 'If that email exists, a verification link has been sent' }
    }
    if (user.emailVerified) {
      throw new ConflictError('Email is already verified')
    }
    const token = await VerificationTokenService.createToken(user.id, 'EMAIL_VERIFICATION')
    await EmailService.sendVerificationEmail(user.email, token)
    return { message: 'Verification email sent successfully' }
  },
}
