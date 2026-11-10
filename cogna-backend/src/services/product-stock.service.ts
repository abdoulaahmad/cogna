import { getProvider } from '@/providers/provider.factory'
import type { ProductStockInfo } from '@/providers/provider.interface'
import { ConflictError } from '@/utils/errors'

export const STOCK_CACHE_TTL_MS = 10 * 60 * 1000
type ProductMapping = { active?: boolean; providerId?: string; providerProductId?: string }
type StockView = { stock: number | null; available: boolean }

class ProductStockService {
  private cache = new Map<string, { timestamp: number; stocks: Record<string, ProductStockInfo> }>()
  private detailCache = new Map<string, { timestamp: number; info: ProductStockInfo | null }>()
  private detailRequests = new Map<string, Promise<ProductStockInfo | null>>()

  async assertAvailable(product: ProductMapping): Promise<void> {
    if (!(await this.attachStock(product)).available) throw new ConflictError('Product is unavailable')
  }

  clearCache(): void {
    this.cache.clear()
    this.detailCache.clear()
    this.detailRequests.clear()
  }

  async getStocksForProvider(providerId: string): Promise<Record<string, ProductStockInfo>> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) return this.cache.get(providerId)?.stocks ?? {}
    const cached = this.cache.get(providerId)
    if (cached && Date.now() - cached.timestamp < STOCK_CACHE_TTL_MS) return cached.stocks
    try {
      const provider = await getProvider(providerId)
      if (provider.getProductStocks) {
        const stocks = await provider.getProductStocks()
        this.cache.set(providerId, { timestamp: Date.now(), stocks })
        return stocks
      }
    } catch {
      // Expired positive stock is not proof that a product can still be sold.
      this.cache.delete(providerId)
    }
    return {}
  }

  private async resolveStock(providerId: string, productId: string, stocks: Record<string, ProductStockInfo>): Promise<ProductStockInfo | null> {
    if (stocks[productId]) return stocks[productId]
    const key = JSON.stringify([providerId, productId])
    const cached = this.detailCache.get(key)
    if (cached && Date.now() - cached.timestamp < STOCK_CACHE_TTL_MS) return cached.info
    const pending = this.detailRequests.get(key)
    if (pending) return pending
    const request = (async () => {
      let info: ProductStockInfo | null = null
      try {
        const provider = await getProvider(providerId)
        info = provider.getProductStock ? await provider.getProductStock(productId) : null
      } catch { /* Unconfirmed stock must stay unavailable. */ }
      this.detailCache.set(key, { timestamp: Date.now(), info })
      return info
    })()
    this.detailRequests.set(key, request)
    try { return await request } finally { this.detailRequests.delete(key) }
  }

  private stockView(product: ProductMapping, info: ProductStockInfo | null): StockView {
    const stock = typeof info?.stock === 'number' && Number.isFinite(info.stock) ? info.stock : null
    return { stock, available: product.active !== false && stock !== null && stock > 0 && info?.available !== false }
  }

  async attachStock<T extends ProductMapping>(product: T): Promise<T & StockView> {
    if (!product.providerId || !product.providerProductId) return { ...product, stock: null, available: false }
    const stocks = await this.getStocksForProvider(product.providerId)
    const info = await this.resolveStock(product.providerId, product.providerProductId, stocks)
    return { ...product, ...this.stockView(product, info) }
  }

  async attachStocks<T extends ProductMapping>(products: T[]): Promise<Array<T & StockView>> {
    const providerIds = [...new Set(products.map(p => p.providerId).filter((id): id is string => Boolean(id)))]
    const providerStocks = new Map(await Promise.all(providerIds.map(async id => [id, await this.getStocksForProvider(id)] as const)))
    return Promise.all(products.map(async product => {
      if (!product.providerId || !product.providerProductId) return { ...product, stock: null, available: false }
      const info = await this.resolveStock(product.providerId, product.providerProductId, providerStocks.get(product.providerId) ?? {})
      return { ...product, ...this.stockView(product, info) }
    }))
  }
}

export const StockService = new ProductStockService()
