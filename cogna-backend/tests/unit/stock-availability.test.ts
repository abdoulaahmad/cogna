import { beforeEach, describe, expect, it, vi } from 'vitest'
import { StockService } from '@/services/product-stock.service'
import { OrderService } from '@/services/order.service'
import { PaymentService } from '@/services/payment.service'
import { WalletService } from '@/services/wallet.service'
import { ProductRepository } from '@/repositories/product.repository'
import { OrderRepository } from '@/repositories/order.repository'
import { WalletRepository } from '@/repositories/wallet.repository'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { buildOrder, buildProduct } from '../fixtures/factories'

vi.mock('@/repositories/product.repository')
vi.mock('@/repositories/order.repository')
vi.mock('@/repositories/wallet.repository')
vi.mock('@/services/payment-gateway-configuration.service')

const product = buildProduct({ active: true })
beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  vi.mocked(ProductRepository.findById).mockResolvedValue(product)
  vi.mocked(WalletRepository.findPurchaseByIdempotencyKey).mockResolvedValue(null)
  vi.spyOn(StockService, 'getStocksForProvider').mockResolvedValue({
    [product.providerProductId]: { stock: 0, available: false },
  })
})

describe('Zero stock availability', () => {
  it('preserves zero stock and rejects an order before persisting it', async () => {
    expect((await StockService.attachStock(product)).stock).toBe(0)
    await expect(OrderService.createOrder('user-1', { productId: product.id, customerEmail: 'buyer@example.com' })).rejects.toThrow('Product is unavailable')
    expect(OrderRepository.create).not.toHaveBeenCalled()
  })
  it('rejects wallet checkout before a debit', async () => {
    await expect(WalletService.purchase({ userId: 'user-1', productId: product.id, customerEmail: 'buyer@example.com', idempotencyKey: 'stock-test' })).rejects.toThrow('Product is unavailable')
    expect(WalletRepository.purchase).not.toHaveBeenCalled()
  })
  it('rejects gateway initialization for an existing pending order before contacting the gateway', async () => {
    const order = buildOrder({ userId: 'user-1', productId: product.id, status: 'PENDING' })
    vi.mocked(OrderRepository.findById).mockResolvedValue(order)
    await expect(PaymentService.initializePayment(order.id, 'user-1', 'buyer@example.com')).rejects.toThrow('Product is unavailable')
    expect(PaymentGatewayConfigurationService.getGateway).not.toHaveBeenCalled()
  })
  it('returns an owned previous wallet purchase when stock has since reached zero', async () => {
    const order = buildOrder({ userId: 'user-1', productId: product.id })
    vi.mocked(WalletRepository.findPurchaseByIdempotencyKey).mockResolvedValue(order)
    await expect(WalletService.purchase({ userId: 'user-1', productId: product.id, customerEmail: 'buyer@example.com', idempotencyKey: 'stock-test' })).resolves.toEqual(order)
    expect(WalletRepository.purchase).not.toHaveBeenCalled()
  })
  it('automatically permits restocked active products and leaves unknown stock distinct from zero', async () => {
    vi.mocked(StockService.getStocksForProvider).mockResolvedValue({ [product.providerProductId]: { stock: 3, available: true } })
    await expect(StockService.assertAvailable(product)).resolves.toBeUndefined()
    vi.mocked(StockService.getStocksForProvider).mockResolvedValue({})
    expect((await StockService.attachStock(product)).stock).toBeNull()
    await expect(StockService.assertAvailable(product)).resolves.toBeUndefined()
    await expect(StockService.assertAvailable({ ...product, active: false })).rejects.toThrow('Product is unavailable')
  })
})
