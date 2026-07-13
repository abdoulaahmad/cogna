/** Job payload for a fulfillment request */
export interface FulfillmentJobData {
  orderId:   string
  productId: string
  userId:    string
}

/** Result stored on the job after completion */
export interface FulfillmentJobResult {
  status:          'COMPLETED' | 'FAILED'
  providerOrderId: string | null
  message?:        string
}

/** Name of the BullMQ queue */
export const FULFILLMENT_QUEUE_NAME = 'fulfillment' as const
