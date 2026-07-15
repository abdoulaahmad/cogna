/** Gateway verification result normalized to decimal major currency units. */
export interface PaymentVerifyResult {
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  gatewayReference: string
  paidAt: Date | null
  metadata: Record<string, unknown>
}