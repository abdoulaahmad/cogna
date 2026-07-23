// PaymentInitResult — what a gateway returns after initializing
export interface PaymentInitResult {
  authorizationUrl: string   // redirect the customer here
  reference:        string   // Cogna reference
  gatewayReference?: string  // gateway's own reference / access code (optional for some gateways)
}
