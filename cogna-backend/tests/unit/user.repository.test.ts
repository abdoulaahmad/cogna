import { describe, it, expect, vi, beforeEach } from 'vitest'
import prisma from '@/config/database'
import { UserRepository } from '@/repositories/user.repository'

const db = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

const mockUser = {
  id: 'user-1', fullName: 'Test User', email: 'test@example.com',
  passwordHash: 'hash', role: 'USER', status: 'ACTIVE',
  emailVerified: false, createdAt: new Date(), updatedAt: new Date(),
}

describe('UserRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findByEmail — returns user when found', async () => {
    db.user.findUnique.mockResolvedValueOnce(mockUser)
    const result = await UserRepository.findByEmail('test@example.com')
    expect(result).toEqual(mockUser)
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } })
  })

  it('findByEmail — returns null when not found', async () => {
    db.user.findUnique.mockResolvedValueOnce(null)
    const result = await UserRepository.findByEmail('none@example.com')
    expect(result).toBeNull()
  })

  it('findById — returns user when found', async () => {
    db.user.findUnique.mockResolvedValueOnce(mockUser)
    const result = await UserRepository.findById('user-1')
    expect(result).toEqual(mockUser)
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } })
  })

  it('findById — returns null when not found', async () => {
    db.user.findUnique.mockResolvedValueOnce(null)
    expect(await UserRepository.findById('bad-id')).toBeNull()
  })

  it('create — creates and returns a new user', async () => {
    db.user.create.mockResolvedValueOnce(mockUser)
    const result = await UserRepository.create({
      fullName: 'Test User', email: 'test@example.com', passwordHash: 'hash',
    })
    expect(result).toEqual(mockUser)
    expect(db.user.create).toHaveBeenCalledWith({
      data: { fullName: 'Test User', email: 'test@example.com', passwordHash: 'hash' },
    })
  })

  it('updateStatus — updates user status', async () => {
    const updated = { ...mockUser, status: 'SUSPENDED' }
    db.user.update.mockResolvedValueOnce(updated)
    const result = await UserRepository.updateStatus('user-1', 'SUSPENDED')
    expect(result.status).toBe('SUSPENDED')
    expect(db.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { status: 'SUSPENDED' } })
  })

  it('markEmailVerified — sets emailVerified=true and status=ACTIVE', async () => {
    const updated = { ...mockUser, emailVerified: true, status: 'ACTIVE' }
    db.user.update.mockResolvedValueOnce(updated)
    const result = await UserRepository.markEmailVerified('user-1')
    expect(result.emailVerified).toBe(true)
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' }, data: { emailVerified: true, status: 'ACTIVE' },
    })
  })

  it('updatePassword — updates password hash', async () => {
    db.user.update.mockResolvedValueOnce({ ...mockUser, passwordHash: 'new-hash' })
    await UserRepository.updatePassword('user-1', 'new-hash')
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' }, data: { passwordHash: 'new-hash' },
    })
  })
})
