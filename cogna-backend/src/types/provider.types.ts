/** Input shape for fulfilling an order via a provider */
export interface FulfillOrderInput {
  orderId:          string   // Cogna internal order ID
  providerProductId: string  // the product's ID in the provider's system
  customerEmail:    string
  amount:           number
  currency:         string
  quantity:         number
  idempotencyKey:   string   // stable provider write key derived from persisted Cogna order ID
  metadata?:        Record<string, unknown>
}

/** Standard result returned after a provider fulfills an order */
export interface FulfillOrderResult {
  providerOrderId: string | null // provider's own reference, absent when submission is rejected
  status:          'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  message?:        string
  rawResponse?:    Record<string, unknown>
}