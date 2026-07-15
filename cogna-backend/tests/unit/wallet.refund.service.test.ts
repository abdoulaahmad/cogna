import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError } from '@/utils/errors'
vi.mock('@/repositories/wallet.repository', () => ({ WalletRepository: { refundPurchase: vi.fn() } }))
import { WalletRepository } from '@/repositories/wallet.repository'
import { WalletService } from '@/services/wallet.service'
const input = { userId: 'user-1', orderId: '11111111-1111-1111-1111-111111111111', reason: 'Provider could not fulfil', idempotencyKey: '1234567890abcdef' }
beforeEach(() => vi.clearAllMocks())
describe('WalletService refunds', () => {
  it('creates a compensating refund through the repository transaction', async () => { vi.mocked(WalletRepository.refundPurchase).mockResolvedValue({ id: 'refund-1', status: 'COMPLETED' } as never); await expect(WalletService.refundPurchase(input)).resolves.toMatchObject({ id: 'refund-1' }); expect(WalletRepository.refundPurchase).toHaveBeenCalledWith(input) })
  it('rejects a refund without an eligible wallet purchase', async () => { vi.mocked(WalletRepository.refundPurchase).mockResolvedValue(null); await expect(WalletService.refundPurchase(input)).rejects.toThrow(ConflictError) })
})