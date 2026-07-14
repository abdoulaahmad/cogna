import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProvider }    from '@/providers/provider.factory'
import { AkudingAdapter } from '@/providers/akunding.adapter'

// Mock Prisma so ProviderFactory can load credentials from DB
vi.mock('@/config/database', () => ({
  prisma: {
    provider: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/config/database'

beforeEach(() => { vi.clearAllMocks() })

describe('ProviderFactory', () => {

  it('should return an AkudingAdapter when provider name is akunding', async () => {
    vi.mocked(prisma.provider.findUnique).mockResolvedValue({
      id:        'prov-1',
      name:      'akunding',
      baseUrl:   'https://api.akunding.com',
      apiKey:    'live-key-abc',
      apiSecret: null,
      apiConfig: null,
      status:    'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const adapter = await getProvider('prov-1')

    expect(adapter).toBeInstanceOf(AkudingAdapter)
  })

  it('should throw when provider is not found in DB', async () => {
    vi.mocked(prisma.provider.findUnique).mockResolvedValue(null)

    await expect(getProvider('prov-1')).rejects.toThrow('Provider not found')
  })

  it('should throw when provider name is unsupported', async () => {
    vi.mocked(prisma.provider.findUnique).mockResolvedValue({
      id:        'prov-2',
      name:      'unknown-provider',
      baseUrl:   'https://unknown.com',
      apiKey:    'key',
      apiSecret: null,
      apiConfig: null,
      status:    'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await expect(getProvider('prov-2')).rejects.toThrow('Unsupported provider')
  })

  it('should throw when provider is INACTIVE', async () => {
    vi.mocked(prisma.provider.findUnique).mockResolvedValue({
      id:        'prov-3',
      name:      'akunding',
      baseUrl:   'https://api.akunding.com',
      apiKey:    'live-key-abc',
      apiSecret: null,
      apiConfig: null,
      status:    'INACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    await expect(getProvider('prov-3')).rejects.toThrow('Provider is inactive')
  })
})
