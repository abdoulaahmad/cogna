/**
 * Payment amounts are decimal major currency units throughout Cogna.
 * Example: ₦500.00 is represented as 500, never 50000 kobo.
 * Gateway adapters perform any required minor-unit conversion at their boundary.
 */
export interface InitPaymentOptions {
  amount: number
  currency: string
  email: string
  reference: string
  orderId: string
  metadata?: Record<string, unknown>
  callbackUrl?: string
}