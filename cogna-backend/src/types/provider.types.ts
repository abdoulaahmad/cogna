/** Input shape for fulfilling an order via a provider */
export interface FulfillOrderInput {
  orderId:          string   // Cogna internal order ID
  providerProductId: string  // the product's ID in the provider's system
  customerEmail:    string
  amount:           number
  currency:         string
  metadata?:        Record<string, unknown>
}

/** Standard result returned after a provider fulfills an order */
export interface FulfillOrderResult {
  providerOrderId: string    // provider's own reference
  status:          'PROCESSING' | 'COMPLETED' | 'FAILED'
  message?:        string
  rawResponse?:    Record<string, unknown>
}
