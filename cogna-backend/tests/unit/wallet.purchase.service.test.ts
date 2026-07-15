import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError } from '@/utils/errors'
vi.mock('@/repositories/wallet.repository', () => ({ WalletRepository: { purchase: vi.fn() } }))
vi.mock('@/repositories/product.repository', () => ({ ProductRepository: { findById: vi.fn() } }))
import { WalletRepository } from '@/repositories/wallet.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { WalletService } from '@/services/wallet.service'
const input = { userId: 'user-1', productId: '11111111-1111-1111-1111-111111111111', customerEmail: 'user@test.com', idempotencyKey: '1234567890abcdef' }
const product = { id: input.productId, providerId: 'provider-1', price: 500, currency: 'NGN', active: true }
beforeEach(() => vi.clearAllMocks())
describe('WalletService purchase', () => {
  it('creates an order through the atomic wallet transaction', async () => { vi.mocked(ProductRepository.findById).mockResolvedValue(product as never); vi.mocked(WalletRepository.purchase).mockResolvedValue({ id: 'order-1' } as never); await expect(WalletService.purchase(input)).resolves.toMatchObject({ id: 'order-1' }); expect(WalletRepository.purchase).toHaveBeenCalledWith(expect.objectContaining({ amount: 500, providerId: 'provider-1' })) })
  it('rejects unavailable products', async () => { vi.mocked(ProductRepository.findById).mockResolvedValue(null); await expect(WalletService.purchase(input)).rejects.toThrow(ConflictError) })
  it('rejects insufficient wallet balance', async () => { vi.mocked(ProductRepository.findById).mockResolvedValue(product as never); vi.mocked(WalletRepository.purchase).mockResolvedValue(null); await expect(WalletService.purchase(input)).rejects.toThrow('Insufficient wallet balance') })
})