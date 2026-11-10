import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StockService, STOCK_CACHE_TTL_MS } from '@/services/product-stock.service'
import * as factory from '@/providers/provider.factory'
import type { IProvider } from '@/providers/provider.interface'

const product = { active: true, providerId: 'provider-1', providerProductId: '91' }
const provider: IProvider = { fulfillOrder: vi.fn(), checkOrderStatus: vi.fn(), getProductStocks: vi.fn(), getProductStock: vi.fn() }
beforeEach(() => {
  vi.restoreAllMocks()
  StockService.clearCache()
  vi.spyOn(factory, 'getProvider').mockResolvedValue(provider)
  vi.spyOn(StockService, 'getStocksForProvider').mockResolvedValue({})
  vi.mocked(provider.getProductStock!).mockReset().mockResolvedValue({ stock: 0, available: false })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('Products absent from the bulk provider list', () => {
  it('looks up individual stock and reports confirmed zero as unavailable', async () => {
    await expect(StockService.attachStock(product)).resolves.toMatchObject({ stock: 0, available: false })
    await expect(StockService.assertAvailable(product)).rejects.toThrow('unavailable')
    expect(provider.getProductStock).toHaveBeenCalledWith('91')
    expect(provider.getProductStock).toHaveBeenCalledTimes(1)
  })
  it('deduplicates and caches detail lookups used by product lists', async () => {
    expect(await StockService.attachStocks([product, product])).toEqual([
      { ...product, stock: 0, available: false }, { ...product, stock: 0, available: false },
    ])
    expect(provider.getProductStock).toHaveBeenCalledTimes(1)
  })
  it('permits a positive confirmed individual stock and honors provider restrictions', async () => {
    vi.mocked(provider.getProductStock!).mockResolvedValue({ stock: 7, available: true })
    await expect(StockService.assertAvailable(product)).resolves.toBeUndefined()
    StockService.clearCache()
    vi.mocked(provider.getProductStock!).mockResolvedValue({ stock: 7, available: false })
    await expect(StockService.attachStock(product)).resolves.toMatchObject({ stock: 7, available: false })
    await expect(StockService.assertAvailable(product)).rejects.toThrow('unavailable')
  })
  it('blocks unknown stock on lookup failure instead of displaying available', async () => {
    vi.mocked(provider.getProductStock!).mockRejectedValue(new Error('Network unavailable'))
    await expect(StockService.attachStock(product)).resolves.toMatchObject({ stock: null, available: false })
    await expect(StockService.assertAvailable(product)).rejects.toThrow('unavailable')
  })
  it('does not reuse expired positive stock after the provider stops responding', async () => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('VITEST', '')
    StockService.clearCache()
    vi.spyOn(factory, 'getProvider').mockResolvedValue(provider)
    vi.mocked(provider.getProductStocks!).mockResolvedValueOnce({ '91': { stock: 2, available: true } }).mockRejectedValueOnce(new Error('Offline'))
    vi.mocked(provider.getProductStock!).mockRejectedValue(new Error('Offline'))
    await expect(StockService.attachStock(product)).resolves.toMatchObject({ stock: 2, available: true })
    vi.advanceTimersByTime(STOCK_CACHE_TTL_MS + 1)
    await expect(StockService.attachStock(product)).resolves.toMatchObject({ stock: null, available: false })
  })
})
