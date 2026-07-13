import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DeveloperService }  from '@/services/developer.service'
import { ApiKeyRepository }  from '@/repositories/api-key.repository'
import { NotFoundError }      from '@/utils/errors'

vi.mock('@/repositories/api-key.repository')

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

describe('DeveloperService', () => {

  // ─── listApiKeys ───────────────────────────────────────────────────────────
  describe('listApiKeys', () => {
    it('should return all API keys for the user', async () => {
      vi.mocked(ApiKeyRepository.findByUserId).mockResolvedValue([mockKey])

      const result = await DeveloperService.listApiKeys('user-1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('My App')
    })
  })

  // ─── createApiKey ──────────────────────────────────────────────────────────
  describe('createApiKey', () => {
    it('should create and return a new API key with cg_live_ prefix', async () => {
      vi.mocked(ApiKeyRepository.create).mockResolvedValue(mockKey)

      const result = await DeveloperService.createApiKey('user-1', 'My App')

      expect(ApiKeyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          name:   'My App',
          apiKey: expect.stringMatching(/^cg_live_[a-f0-9]{32}$/),
        })
      )
      expect(result.name).toBe('My App')
    })

    it('should generate a unique key on each call', async () => {
      vi.mocked(ApiKeyRepository.create).mockResolvedValue(mockKey)

      await DeveloperService.createApiKey('user-1', 'Key A')
      await DeveloperService.createApiKey('user-1', 'Key B')

      const [call1, call2] = vi.mocked(ApiKeyRepository.create).mock.calls
      expect(call1[0].apiKey).not.toBe(call2[0].apiKey)
    })
  })

  // ─── revokeApiKey ──────────────────────────────────────────────────────────
  describe('revokeApiKey', () => {
    it('should revoke the key when it belongs to the user', async () => {
      const revoked = { ...mockKey, status: 'INACTIVE' as const }
      vi.mocked(ApiKeyRepository.findById).mockResolvedValue(mockKey)
      vi.mocked(ApiKeyRepository.revoke).mockResolvedValue(revoked)

      const result = await DeveloperService.revokeApiKey('key-1', 'user-1')

      expect(result.status).toBe('INACTIVE')
    })

    it('should throw NotFoundError when key does not belong to user', async () => {
      vi.mocked(ApiKeyRepository.findById).mockResolvedValue(null)

      await expect(
        DeveloperService.revokeApiKey('key-1', 'different-user')
      ).rejects.toThrow(NotFoundError)
    })
  })
})
