/** Job payload for a fulfillment request */
export interface FulfillmentJobData {
  orderId:   string
  productId: string
  userId:    string
}

/** Result stored on the job after completion */
export interface FulfillmentJobResult {
  status:          'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  providerOrderId: string | null
  message?:        string
}

/** Name of the BullMQ queue */
export const FULFILLMENT_QUEUE_NAME = 'fulfillment' as const

/** Valid job names for the fulfillment queue */
export type FulfillmentJobName = 'fulfill-order' | 'poll-processing-orders'
