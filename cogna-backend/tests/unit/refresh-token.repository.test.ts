import { describe, it, expect, vi, beforeEach } from 'vitest'
import prisma from '@/config/database'
import { RefreshTokenRepository } from '@/repositories/refresh-token.repository'

const db = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

const mockToken = {
  id: 'rt-1', userId: 'user-1', token: 'tok-abc',
  expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(),
}

describe('RefreshTokenRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('create — creates a refresh token record', async () => {
    db.refreshToken.create.mockResolvedValueOnce(mockToken)
    const result = await RefreshTokenRepository.create({
      userId: 'user-1', token: 'tok-abc', expiresAt: mockToken.expiresAt,
    })
    expect(result).toEqual(mockToken)
    expect(db.refreshToken.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', token: 'tok-abc', expiresAt: mockToken.expiresAt },
    })
  })

  it('findByToken — returns token when found', async () => {
    db.refreshToken.findUnique.mockResolvedValueOnce(mockToken)
    const result = await RefreshTokenRepository.findByToken('tok-abc')
    expect(result).toEqual(mockToken)
    expect(db.refreshToken.findUnique).toHaveBeenCalledWith({ where: { token: 'tok-abc' } })
  })

  it('findByToken — returns null when not found', async () => {
    db.refreshToken.findUnique.mockResolvedValueOnce(null)
    expect(await RefreshTokenRepository.findByToken('bad-token')).toBeNull()
  })

  it('deleteByToken — deletes a specific token', async () => {
    db.refreshToken.delete.mockResolvedValueOnce(mockToken)
    await RefreshTokenRepository.deleteByToken('tok-abc')
    expect(db.refreshToken.delete).toHaveBeenCalledWith({ where: { token: 'tok-abc' } })
  })

  it('deleteAllForUser — deletes all tokens for a user', async () => {
    db.refreshToken.deleteMany.mockResolvedValueOnce({ count: 3 })
    await RefreshTokenRepository.deleteAllForUser('user-1')
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
  })

  it('deleteExpired — deletes tokens older than now', async () => {
    db.refreshToken.deleteMany.mockResolvedValueOnce({ count: 5 })
    await RefreshTokenRepository.deleteExpired()
    expect(db.refreshToken.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    })
  })
})
