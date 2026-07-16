import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConflictError } from '@/utils/errors'

vi.mock('@/repositories/wallet.repository', () => ({ WalletRepository: {
  findFundingByReference: vi.fn(), creditFunding: vi.fn(), findFundingByIdempotencyKey: vi.fn(),
  getOrCreate: vi.fn(), createFunding: vi.fn(), saveCheckout: vi.fn(),
} }))
vi.mock('@/services/payment-gateway-configuration.service', () => ({ PaymentGatewayConfigurationService: { getGateway: vi.fn() } }))

import { WalletRepository } from '@/repositories/wallet.repository'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { WalletService } from '@/services/wallet.service'

const funding = { id: 'fund-1', userId: 'user-1', gateway: 'PAYSTACK', reference: 'wallet_ref', amount: 500, currency: 'NGN', status: 'PENDING' }
const success = { status: 'success' as const, amount: 500, currency: 'NGN', gatewayReference: 'gw-1', paidAt: new Date(), metadata: {} }

beforeEach(() => vi.clearAllMocks())

describe('WalletService funding verification', () => {
  it('credits a verified matching funding exactly once', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockResolvedValue({ verifyPayment: vi.fn().mockResolvedValue(success) } as never)
    vi.mocked(WalletRepository.creditFunding).mockResolvedValue({ ...funding, status: 'COMPLETED' } as never)
    await WalletService.verifyFunding('wallet_ref', 'PAYSTACK')
    expect(WalletRepository.creditFunding).toHaveBeenCalledWith('fund-1', 'gw-1', {})
  })
  it('does not credit a pending gateway response', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockResolvedValue({ verifyPayment: vi.fn().mockResolvedValue({ ...success, status: 'pending' }) } as never)
    await WalletService.verifyFunding('wallet_ref')
    expect(WalletRepository.creditFunding).not.toHaveBeenCalled()
  })
  it('rejects a successful gateway response with a mismatched amount', async () => {
    vi.mocked(WalletRepository.findFundingByReference).mockResolvedValue(funding as never)
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockResolvedValue({ verifyPayment: vi.fn().mockResolvedValue({ ...success, amount: 501 }) } as never)
    await expect(WalletService.verifyFunding('wallet_ref')).rejects.toThrow(ConflictError)
    expect(WalletRepository.creditFunding).not.toHaveBeenCalled()
  })
  it('rejects an invalid webhook signature', async () => {
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockResolvedValue({ validateWebhook: vi.fn().mockReturnValue(false) } as never)
    await expect(WalletService.handleFundingWebhook('PAYSTACK', '{"data":{"reference":"wallet_ref"}}', 'bad')).resolves.toBe(false)
    expect(WalletRepository.findFundingByReference).not.toHaveBeenCalled()
  })
  it('checks gateway readiness before creating a funding record', async () => {
    vi.mocked(WalletRepository.findFundingByIdempotencyKey).mockResolvedValue(null)
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockRejectedValue(new ConflictError('Paystack is not configured'))

    await expect(WalletService.initializeFunding({
      userId: 'user-1', email: 'user@example.com', amount: 500, currency: 'NGN', gateway: 'PAYSTACK',
      idempotencyKey: 'wallet-test-idempotency-1',
    })).rejects.toThrow('Paystack is not configured')

    expect(WalletRepository.getOrCreate).not.toHaveBeenCalled()
    expect(WalletRepository.createFunding).not.toHaveBeenCalled()
  })

  it('successfully initializes funding and returns reference, authorizationUrl, and accessCode', async () => {
    vi.mocked(WalletRepository.findFundingByIdempotencyKey).mockResolvedValue(null)
    vi.mocked(PaymentGatewayConfigurationService.getGateway).mockResolvedValue({
      initializePayment: vi.fn().mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/fund',
        reference: 'wallet_ref',
        gatewayReference: 'access-code-123',
      }),
    } as never)
    vi.mocked(WalletRepository.getOrCreate).mockResolvedValue({ id: 'wallet-1', currency: 'NGN' } as never)
    vi.mocked(WalletRepository.createFunding).mockResolvedValue({ id: 'funding-1', reference: 'wallet_ref' } as never)

    const result = await WalletService.initializeFunding({
      userId: 'user-1', email: 'user@example.com', amount: 500, currency: 'NGN', gateway: 'PAYSTACK',
      idempotencyKey: 'wallet-test-idempotency-2',
    })

    expect(result).toEqual({
      reference: expect.stringMatching(/^wallet_\d+_[a-f0-9\-]+$/),
      authorizationUrl: 'https://checkout.paystack.com/fund',
      accessCode: 'access-code-123',
    })
  })
})