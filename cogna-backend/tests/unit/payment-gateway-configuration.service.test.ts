import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PaymentGateway } from '@prisma/client'
import { PaymentGatewayConfigurationRepository } from '@/repositories/payment-gateway-configuration.repository'
import { PaymentGatewayConfigurationService } from '@/services/payment-gateway-configuration.service'
import { getPaymentGateway } from '@/payments/GatewayFactory'
import { encryptCredential } from '@/utils/credential-crypto'

vi.mock('@/repositories/payment-gateway-configuration.repository', () => ({
  PaymentGatewayConfigurationRepository: {
    findByGateway: vi.fn(),
    upsert: vi.fn(),
  },
}))
vi.mock('@/payments/GatewayFactory', () => ({ getPaymentGateway: vi.fn(() => ({ gateway: 'adapter' })) }))

beforeEach(() => vi.clearAllMocks())

describe('PaymentGatewayConfigurationService', () => {
  it('returns masked database-backed Paystack status without exposing credentials', async () => {
    vi.mocked(PaymentGatewayConfigurationRepository.findByGateway).mockResolvedValue({
      id: 'gateway-1', gateway: PaymentGateway.PAYSTACK,
      publicKey: encryptCredential('pk_live_1234567890'), secretKey: encryptCredential('sk_live_1234567890'),
      enabled: true, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'),
    })

    const result = await PaymentGatewayConfigurationService.getPaystackStatus()

    expect(result).toMatchObject({ configured: true, enabled: true, source: 'ADMIN_PORTAL', mode: 'LIVE' })
    expect(result.publicKey).not.toContain('1234567890')
    expect(result.secretKey).not.toContain('1234567890')
  })

  it('builds the Paystack adapter with decrypted stored credentials', async () => {
    vi.mocked(PaymentGatewayConfigurationRepository.findByGateway).mockResolvedValue({
      id: 'gateway-1', gateway: PaymentGateway.PAYSTACK, publicKey: null,
      secretKey: encryptCredential('sk_test_stored123'), enabled: true,
      createdAt: new Date(), updatedAt: new Date(),
    })

    await PaymentGatewayConfigurationService.getGateway('PAYSTACK')

    expect(getPaymentGateway).toHaveBeenCalledWith('PAYSTACK', { secretKey: 'sk_test_stored123' })
  })

  it('refuses to build a disabled configured gateway', async () => {
    vi.mocked(PaymentGatewayConfigurationRepository.findByGateway).mockResolvedValue({
      id: 'gateway-1', gateway: PaymentGateway.PAYSTACK, publicKey: null,
      secretKey: encryptCredential('sk_test_stored123'), enabled: false,
      createdAt: new Date(), updatedAt: new Date(),
    })

    await expect(PaymentGatewayConfigurationService.getGateway('PAYSTACK')).rejects.toThrow('PAYSTACK is disabled')
  })
})