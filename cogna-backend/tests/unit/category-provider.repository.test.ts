import { describe, it, expect, vi, beforeEach } from 'vitest'
import prisma from '@/config/database'
import { CategoryRepository } from '@/repositories/category.repository'
import { ProviderRepository }  from '@/repositories/provider.repository'

const db = prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>

// ── Category ────────────────────────────────────────────────────────────────

const mockCategory = {
  id: 'cat-1', name: 'Streaming', slug: 'streaming',
  description: null, iconUrl: null, isActive: true,
  createdAt: new Date(), updatedAt: new Date(),
}

describe('CategoryRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findAll — returns ordered list', async () => {
    db.category.findMany.mockResolvedValueOnce([mockCategory])
    const result = await CategoryRepository.findAll()
    expect(result).toHaveLength(1)
    expect(db.category.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
  })

  it('findById — returns category when found', async () => {
    db.category.findUnique.mockResolvedValueOnce(mockCategory)
    const result = await CategoryRepository.findById('cat-1')
    expect(result).toEqual(mockCategory)
    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })

  it('findById — returns null when not found', async () => {
    db.category.findUnique.mockResolvedValueOnce(null)
    expect(await CategoryRepository.findById('bad-id')).toBeNull()
  })

  it('findBySlug — returns category by slug', async () => {
    db.category.findUnique.mockResolvedValueOnce(mockCategory)
    const result = await CategoryRepository.findBySlug('streaming')
    expect(result).toEqual(mockCategory)
    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { slug: 'streaming' } })
  })

  it('create — creates a new category', async () => {
    db.category.create.mockResolvedValueOnce(mockCategory)
    const result = await CategoryRepository.create({ name: 'Streaming', slug: 'streaming' })
    expect(result).toEqual(mockCategory)
    expect(db.category.create).toHaveBeenCalledWith({ data: { name: 'Streaming', slug: 'streaming' } })
  })

  it('update — updates category fields', async () => {
    const updated = { ...mockCategory, name: 'Updated' }
    db.category.update.mockResolvedValueOnce(updated)
    const result = await CategoryRepository.update('cat-1', { name: 'Updated' })
    expect(result.name).toBe('Updated')
    expect(db.category.update).toHaveBeenCalledWith({ where: { id: 'cat-1' }, data: { name: 'Updated' } })
  })

  it('delete — deletes a category', async () => {
    db.category.delete.mockResolvedValueOnce(mockCategory)
    const result = await CategoryRepository.delete('cat-1')
    expect(result).toEqual(mockCategory)
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } })
  })
})

// ── Provider ────────────────────────────────────────────────────────────────

const mockProvider = {
  id: 'prov-1', name: 'Akunding', baseUrl: 'https://api.akunding.com',
  apiKey: 'key', apiSecret: 'secret', apiConfig: null,
  status: 'ACTIVE', isActive: true, slug: 'akunding',
  createdAt: new Date(), updatedAt: new Date(),
}

describe('ProviderRepository', () => {
  beforeEach(() => vi.clearAllMocks())

  it('findAll — returns ordered list of providers', async () => {
    db.provider.findMany.mockResolvedValueOnce([mockProvider])
    const result = await ProviderRepository.findAll()
    expect(result).toHaveLength(1)
    expect(db.provider.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } })
  })

  it('findById — returns provider when found', async () => {
    db.provider.findUnique.mockResolvedValueOnce(mockProvider)
    const result = await ProviderRepository.findById('prov-1')
    expect(result).toEqual(mockProvider)
  })

  it('findById — returns null when not found', async () => {
    db.provider.findUnique.mockResolvedValueOnce(null)
    expect(await ProviderRepository.findById('bad-id')).toBeNull()
  })

  it('create — creates a provider without apiConfig', async () => {
    db.provider.create.mockResolvedValueOnce(mockProvider)
    const result = await ProviderRepository.create({ name: 'Akunding', baseUrl: 'https://api.akunding.com', apiKey: 'key' })
    expect(result).toEqual(mockProvider)
    expect(db.provider.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Akunding',
        baseUrl: 'https://api.akunding.com',
        apiKey: expect.stringMatching(/^v1:/),
      }),
    })
  })

  it('create — creates a provider WITH apiConfig', async () => {
    db.provider.create.mockResolvedValueOnce(mockProvider)
    await ProviderRepository.create({ name: 'X', baseUrl: 'https://x.com', apiKey: 'k', apiConfig: { timeout: '5000' } })
    expect(db.provider.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ apiConfig: { timeout: '5000' } }),
    })
  })

  it('update — updates provider (no apiConfig)', async () => {
    db.provider.update.mockResolvedValueOnce(mockProvider)
    await ProviderRepository.update('prov-1', { name: 'Updated' })
    expect(db.provider.update).toHaveBeenCalledWith({ where: { id: 'prov-1' }, data: { name: 'Updated' } })
  })

  it('update — updates provider WITH apiConfig', async () => {
    db.provider.update.mockResolvedValueOnce(mockProvider)
    await ProviderRepository.update('prov-1', { apiConfig: { key: 'val' } })
    expect(db.provider.update).toHaveBeenCalledWith({
      where: { id: 'prov-1' },
      data: expect.objectContaining({ apiConfig: { key: 'val' } }),
    })
  })

  it('delete — deletes a provider', async () => {
    db.provider.delete.mockResolvedValueOnce(mockProvider)
    const result = await ProviderRepository.delete('prov-1')
    expect(result).toEqual(mockProvider)
    expect(db.provider.delete).toHaveBeenCalledWith({ where: { id: 'prov-1' } })
  })
})
