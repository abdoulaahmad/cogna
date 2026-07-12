// InitPaymentOptions — what callers pass in to initialize a payment
export interface InitPaymentOptions {
  amount:        number   // in kobo/lowest denomination
  currency:      string   // e.g. "NGN"
  email:         string
  reference:     string   // unique Cogna reference
  orderId:       string
  metadata?:     Record<string, unknown>
  callbackUrl?:  string
}
