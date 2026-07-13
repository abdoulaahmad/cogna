import { Queue } from 'bullmq'
import { createRedisConnection }                    from '@/config/redis'
import type { FulfillmentJobData, FulfillmentJobResult } from '@/types/fulfillment-job.types'
import { FULFILLMENT_QUEUE_NAME }                    from '@/types/fulfillment-job.types'

/**
 * The fulfillment queue.
 * Producers (payment webhook handler) enqueue jobs here.
 * The worker process consumes them.
 */
export const fulfillmentQueue = new Queue<FulfillmentJobData, FulfillmentJobResult>(
  FULFILLMENT_QUEUE_NAME,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts:      3,
      backoff: {
        type:  'exponential',
        delay: 5000,          // 5s, 25s, 125s
      },
      removeOnComplete: { count: 100 },
      removeOnFail:     { count: 500 },
    },
  }
)
