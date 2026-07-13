import type { PaymentGatewayType } from './payment-gateway.types'

/** Input shape for creating a new Payment record */
export interface PaymentCreateInput {
  orderId:    string
  userId:     string
  gateway:    PaymentGatewayType
  reference:  string
  amount:     number
  currency:   string
}
