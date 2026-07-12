import { describe, it, expect, vi } from 'vitest'

// Mock env before any imports that trigger env validation
vi.mock('@/config/env', () => ({ env: { PAYSTACK_SECRET_KEY: 'test', MONNIFY_API_KEY: 'test', MONNIFY_SECRET_KEY: 'test', MONNIFY_CONTRACT_CODE: 'test', MONNIFY_BASE_URL: 'https://sandbox.monnify.com', APP_ENV: 'test' } }))

import { getPaymentGateway } from '@/payments/GatewayFactory'
import { PaystackAdapter }   from '@/payments/PaystackAdapter'
import { MonnifyAdapter }    from '@/payments/MonnifyAdapter'


describe('GatewayFactory', () => {

  it('should return a PaystackAdapter for PAYSTACK gateway type', () => {
    const gateway = getPaymentGateway('PAYSTACK')
    expect(gateway).toBeInstanceOf(PaystackAdapter)
  })

  it('should return a MonnifyAdapter for MONNIFY gateway type', () => {
    const gateway = getPaymentGateway('MONNIFY')
    expect(gateway).toBeInstanceOf(MonnifyAdapter)
  })

  it('should throw for an unknown gateway type', () => {
    expect(() => getPaymentGateway('UNKNOWN' as never)).toThrow('Unsupported payment gateway')
  })

  it('should pass override config to PaystackAdapter', () => {
    const gateway = getPaymentGateway('PAYSTACK', { secretKey: 'sk_custom_key' })
    expect(gateway).toBeInstanceOf(PaystackAdapter)
  })

  it('should pass override config to MonnifyAdapter', () => {
    const gateway = getPaymentGateway('MONNIFY', { contractCode: 'CUSTOM_CODE' })
    expect(gateway).toBeInstanceOf(MonnifyAdapter)
  })
})
