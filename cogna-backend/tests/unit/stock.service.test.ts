import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StockService, STOCK_CACHE_TTL_MS } from '@/services/product-stock.service'
import * as providerFactory from '@/providers/provider.factory'
import type { IProvider } from '@/providers/provider.interface'

describe('StockService', () => {
  beforeEach(() => {
    StockService.clearCache()
    vi.restoreAllMocks()
  })

  it('has a 10-minute cache TTL', () => {
    expect(STOCK_CACHE_TTL_MS).toBe(10 * 60 * 1000)
  })

  it('attaches stock from provider stocks', async () => {
    const mockProvider: IProvider = {
      fulfillOrder: vi.fn(),
      checkOrderStatus: vi.fn(),
      getProductStocks: vi.fn().mockResolvedValue({
        'sub-gpt': { stock: 45, available: true },
        'sub-gemini': { stock: 0, available: false },
      }),
    }

    vi.spyOn(providerFactory, 'getProvider').mockResolvedValue(mockProvider)

    const products = [
      { id: '1', providerId: 'prov-1', providerProductId: 'sub-gpt', name: 'GPT' },
      { id: '2', providerId: 'prov-1', providerProductId: 'sub-gemini', name: 'Gemini' },
      { id: '3', providerId: 'prov-1', providerProductId: 'sub-unknown', name: 'Unknown' },
      { id: '4', name: 'NoProvider' },
    ]

    // Temporarily mock process.env.NODE_ENV so it performs cache resolution
    const origEnv = process.env.NODE_ENV
    delete (process.env as any).NODE_ENV
    delete (process.env as any).VITEST

    try {
      const enriched = await StockService.attachStocks(products)

      expect(enriched[0].stock).toBe(45)
      expect(enriched[1].stock).toBe(0)
      expect(enriched[2].stock).toBeNull()
      expect(enriched[3].stock).toBeNull()
      expect(mockProvider.getProductStocks).toHaveBeenCalledTimes(1)
    } finally {
      process.env.NODE_ENV = origEnv
      process.env.VITEST = 'true'
    }
  })

  it('uses cached stock on subsequent calls within 10 minutes', async () => {
    const mockProvider: IProvider = {
      fulfillOrder: vi.fn(),
      checkOrderStatus: vi.fn(),
      getProductStocks: vi.fn().mockResolvedValue({
        '60': { stock: 120, available: true },
      }),
    }

    vi.spyOn(providerFactory, 'getProvider').mockResolvedValue(mockProvider)

    const origEnv = process.env.NODE_ENV
    delete (process.env as any).NODE_ENV
    delete (process.env as any).VITEST

    try {
      const p1 = await StockService.attachStock({ providerId: 'prov-1', providerProductId: '60' })
      expect(p1.stock).toBe(120)

      const p2 = await StockService.attachStock({ providerId: 'prov-1', providerProductId: '60' })
      expect(p2.stock).toBe(120)

      // Only called once due to 10-minute cache
      expect(mockProvider.getProductStocks).toHaveBeenCalledTimes(1)
    } finally {
      process.env.NODE_ENV = origEnv
      process.env.VITEST = 'true'
    }
  })

  it('handles provider error gracefully and returns stock: null', async () => {
    vi.spyOn(providerFactory, 'getProvider').mockRejectedValue(new Error('Network error'))

    const origEnv = process.env.NODE_ENV
    delete (process.env as any).NODE_ENV
    delete (process.env as any).VITEST

    try {
      const p = await StockService.attachStock({ providerId: 'prov-err', providerProductId: '99' })
      expect(p.stock).toBeNull()
    } finally {
      process.env.NODE_ENV = origEnv
      process.env.VITEST = 'true'
    }
  })
})
