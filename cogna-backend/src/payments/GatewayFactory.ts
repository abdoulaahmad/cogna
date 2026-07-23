import { PaystackAdapter } from './PaystackAdapter'
import { MonnifyAdapter }  from './MonnifyAdapter'
import { PlisioAdapter }   from './PlisioAdapter'
import type { IPaymentGateway }   from './IPaymentGateway'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

/**
 * GatewayFactory — resolves the correct payment adapter for a product.
 *
 * Per-product overrides: products store their own gateway type and can
 * optionally store API key overrides in `providerApiOverride` (JSON).
 * This lets each product use a different Paystack/Monnify account.
 */
export function getPaymentGateway(
  gatewayType: PaymentGatewayType,
  overrideConfig?: Record<string, string>
): IPaymentGateway {
  switch (gatewayType) {
    case 'PAYSTACK':
      return new PaystackAdapter(overrideConfig?.secretKey)

    case 'MONNIFY':
      return new MonnifyAdapter({
        apiKey:       overrideConfig?.apiKey,
        secretKey:    overrideConfig?.secretKey,
        contractCode: overrideConfig?.contractCode,
        baseUrl:      overrideConfig?.baseUrl,
      })

    case 'PLISIO':
      return new PlisioAdapter(overrideConfig?.secretKey)

    default: {
      const exhaustive: never = gatewayType
      throw new Error(`Unsupported payment gateway: ${String(exhaustive)}`)
    }
  }
}
