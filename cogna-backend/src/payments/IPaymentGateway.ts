import type { InitPaymentOptions } from '@/types/init-payment-options.types'
import type { PaymentInitResult }  from '@/types/payment-init-result.types'
import type { PaymentVerifyResult } from '@/types/payment-verify-result.types'

/**
 * IPaymentGateway — the contract every payment adapter must implement.
 *
 * Adding a new gateway (e.g. Flutterwave) means implementing this interface
 * and registering it in the GatewayFactory. No other code changes needed.
 */
export interface IPaymentGateway {
  /** Initialize a payment session and return a redirect URL */
  initializePayment(options: InitPaymentOptions): Promise<PaymentInitResult>

  /** Verify a payment by its Cogna reference */
  verifyPayment(reference: string): Promise<PaymentVerifyResult>

  /** Validate an inbound webhook signature — returns true if authentic */
  validateWebhook(payload: string, signature: string): boolean
}
