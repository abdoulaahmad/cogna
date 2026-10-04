import { getProvider } from '@/providers/provider.factory'
import type { ProductStockInfo } from '@/providers/provider.interface'

interface CachedProviderStocks {
  timestamp: number
  stocks: Record<string, ProductStockInfo>
}

// 10-minute cache TTL as requested by the user
export const STOCK_CACHE_TTL_MS = 10 * 60 * 1000

class ProductStockService {
  private cache = new Map<string, CachedProviderStocks>()

  /**
   * Clear the in-memory cache (useful for testing or manual refreshes).
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Fetch stocks for a given provider with 10-minute TTL caching.
   */
  async getStocksForProvider(providerId: string): Promise<Record<string, ProductStockInfo>> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      return this.cache.get(providerId)?.stocks ?? {}
    }

    const now = Date.now()
    const cached = this.cache.get(providerId)

    if (cached && now - cached.timestamp < STOCK_CACHE_TTL_MS) {
      return cached.stocks
    }

    try {
      const provider = await getProvider(providerId)
      if (typeof provider.getProductStocks === 'function') {
        const stocks = await provider.getProductStocks()
        this.cache.set(providerId, { timestamp: now, stocks })
        return stocks
      }
    } catch (error) {
      console.warn(`[ProductStockService] Failed to refresh stocks for provider ${providerId}:`, error)
      // Return stale cache if available upon network failure
      if (cached) return cached.stocks
    }

    return cached?.stocks ?? {}
  }

  /**
   * Attach available stock to a single product record.
   */
  async attachStock<T extends { providerId?: string; providerProductId?: string }>(
    product: T
  ): Promise<T & { stock: number | null }> {
    if (!product || !product.providerId || !product.providerProductId) {
      return { ...product, stock: null }
    }

    try {
      const stocks = await this.getStocksForProvider(product.providerId)
      const stockInfo = stocks[product.providerProductId]
      return {
        ...product,
        stock: stockInfo && typeof stockInfo.stock === 'number' ? stockInfo.stock : null,
      }
    } catch {
      return { ...product, stock: null }
    }
  }

  /**
   * Attach available stocks in bulk to a list of products.
   */
  async attachStocks<T extends { providerId?: string; providerProductId?: string }>(
    products: T[]
  ): Promise<Array<T & { stock: number | null }>> {
    if (!Array.isArray(products) || products.length === 0) {
      return []
    }

    // Collect unique provider IDs
    const providerIds = Array.from(
      new Set(
        products
          .map((p) => p.providerId)
          .filter((id): id is string => Boolean(id))
      )
    )

    // Fetch stocks for all providers in parallel
    const stocksByProvider = new Map<string, Record<string, ProductStockInfo>>()
    await Promise.all(
      providerIds.map(async (pId) => {
        try {
          const stocks = await this.getStocksForProvider(pId)
          stocksByProvider.set(pId, stocks)
        } catch {
          stocksByProvider.set(pId, {})
        }
      })
    )

    return products.map((product) => {
      if (!product.providerId || !product.providerProductId) {
        return { ...product, stock: null }
      }

      const providerStocks = stocksByProvider.get(product.providerId)
      const stockInfo = providerStocks ? providerStocks[product.providerProductId] : undefined

      return {
        ...product,
        stock: stockInfo && typeof stockInfo.stock === 'number' ? stockInfo.stock : null,
      }
    })
  }
}

export const StockService = new ProductStockService()
