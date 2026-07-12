// PaymentVerifyResult — result of verifying a payment reference
export interface PaymentVerifyResult {
  status:           'success' | 'failed' | 'pending'
  amount:           number
  currency:         string
  gatewayReference: string
  paidAt:           Date | null
  metadata:         Record<string, unknown>
}
