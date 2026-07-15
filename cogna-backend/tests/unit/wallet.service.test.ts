import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError } from '@/utils/errors'

vi.mock('@/repositories/wallet.repository', () => ({ WalletRepository: { findFundingByReference: vi.fn(), creditFunding: vi.fn() } }))
vi.mock('@/payments/GatewayFactory', () => ({ getPaymentGateway: vi.fn(() => ({ verifyPayment: vi.fn(), validateWebhook: vi.fn() })) }))

import { WalletRepository } from '@/repositories/wallet.repository'
import { getPaymentGateway } from '@/payments/GatewayFactory'
import { WalletService } from '@/services/wallet.service'

const funding = { id: 'fund-1', userId: 'user-1', gateway: 'PAYSTACK', reference: 'wallet_ref', amount: 500, currency: 'NGN', status: 'PENDING' }
const success = { status: 'success' as const, amount: 500, currency: 'NGN', gatewayReference: 'gw-1', paidAt: new Date(), metadata: {} }

beforeEach(() => vi.clearAllMocks())

describe('WalletService funding verification', () => {
  it('credits a verified matching funding exactly once', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(getPaymentGateway).mockReturnValue({ verifyPayment: vi.fn().mockResolvedValue(success) } as never)
    vi.mocked(WalletRepository.creditFunding).mockResolvedValue({ ...funding, status: 'COMPLETED' } as never)
    await WalletService.verifyFunding('wallet_ref', 'PAYSTACK')
    expect(WalletRepository.creditFunding).toHaveBeenCalledWith('fund-1', 'gw-1', {})
  })
  it('does not credit a pending gateway response', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(getPaymentGateway).mockReturnValue({ verifyPayment: vi.fn().mockResolvedValue({ ...success, status: 'pending' }) } as never)
    await WalletService.verifyFunding('wallet_ref')
    expect(WalletRepository.creditFunding).not.toHaveBeenCalled()
  })
  it('rejects a successful gateway response with a mismatched amount', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(getPaymentGateway).mockReturnValue({ verifyPayment: vi.fn().mockResolvedValue({ ...success, amount: 501 }) } as never)
    await expect(WalletService.verifyFunding('wallet_ref')).rejects.toThrow(ConflictError)
    expect(WalletRepository.creditFunding).not.toHaveBeenCalled()
  })
  it('rejects an invalid webhook signature', async () => {
    vi.mocked(getPaymentGateway).mockReturnValue({ validateWebhook: vi.fn().mockReturnValue(false) } as never)
    await expect(WalletService.handleFundingWebhook('PAYSTACK', '{"data":{"reference":"wallet_ref"}}', 'bad')).resolves.toBe(false)
    expect(WalletRepository.findFundingByReference).not.toHaveBeenCalled()
  })
})