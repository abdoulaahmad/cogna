import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiKeyRepository } from '@/repositories/api-key.repository'

vi.mock('@/config/database', () => {
  const mockPrisma = {
    apiKey: {
      findMany:   vi.fn(),
      findFirst:  vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
    },
  }
  return {
    default: mockPrisma,
    prisma:  mockPrisma,
  }
})

import { prisma } from '@/config/database'


const mockKey = {
  id:         'key-1',
  userId:     'user-1',
  name:       'My App',
  apiKey:     'cg_live_abc123',
  status:     'ACTIVE' as const,
  lastUsedAt: null,
  createdAt:  new Date('2026-01-01'),
}

beforeEach(() => { vi.clearAllMocks() })

describe('ApiKeyRepository', () => {

  // ─── findByUserId ──────────────────────────────────────────────────────────
  describe('findByUserId', () => {
    it('should return all keys for a user', async () => {
      vi.mocked(prisma.apiKey.findMany).mockResolvedValue([mockKey])

      const result = await ApiKeyRepository.findByUserId('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].userId).toBe('user-1')
    })
  })

  // ─── findByKey ─────────────────────────────────────────────────────────────
  describe('findByKey', () => {
    it('should return key when it exists', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(mockKey)

      const result = await ApiKeyRepository.findByKey('cg_live_abc123')

      expect(result?.id).toBe('key-1')
    })

    it('should return null when key does not exist', async () => {
      vi.mocked(prisma.apiKey.findUnique).mockResolvedValue(null)

      const result = await ApiKeyRepository.findByKey('nonexistent')

      expect(result).toBeNull()
    })
  })

  // ─── create ────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create and return a new API key', async () => {
      vi.mocked(prisma.apiKey.create).mockResolvedValue(mockKey)

      const result = await ApiKeyRepository.create({
        userId: 'user-1',
        name:   'My App',
        apiKey: 'cg_live_abc123',
      })

      expect(prisma.apiKey.create).toHaveBeenCalledOnce()
      expect(result.apiKey).toBe('cg_live_abc123')
    })
  })

  // ─── revoke ────────────────────────────────────────────────────────────────
  describe('revoke', () => {
    it('should set status to INACTIVE', async () => {
      const revoked = { ...mockKey, status: 'INACTIVE' as const }
      vi.mocked(prisma.apiKey.update).mockResolvedValue(revoked)

      const result = await ApiKeyRepository.revoke('key-1', 'user-1')

      expect(result.status).toBe('INACTIVE')
    })
  })
})
