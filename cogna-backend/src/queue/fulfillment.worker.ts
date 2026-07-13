import { Worker, type Job } from 'bullmq'
import { createRedisConnection }   from '@/config/redis'
import { getProvider }             from '@/providers/provider.factory'
import { OrderRepository }         from '@/repositories/order.repository'
import { ProductRepository }       from '@/repositories/product.repository'
import type { FulfillmentJobData, FulfillmentJobResult } from '@/types/fulfillment-job.types'
import { FULFILLMENT_QUEUE_NAME }  from '@/types/fulfillment-job.types'

/**
 * Process a fulfillment job.
 *
 * Flow:
 *  1. Load order and product from DB
 *  2. Resolve the correct provider adapter via ProviderFactory
 *  3. Call adapter.fulfillOrder() → gets a providerOrderId
 *  4. Mark order PROCESSING + store providerOrderId
 *  5. Poll / wait for completion (status check handled by a separate scheduled job)
 *
 * On failure: BullMQ retries automatically (up to 3 attempts).
 * After all retries exhausted, order is marked FAILED.
 */
async function processFulfillmentJob(
  job: Job<FulfillmentJobData, FulfillmentJobResult>
): Promise<FulfillmentJobResult> {
  const { orderId, productId } = job.data

  const order   = await OrderRepository.findById(orderId)
  const product = await ProductRepository.findById(productId)

  if (!order || !product) {
    throw new Error(`Order or product not found: orderId=${orderId}`)
  }

  await job.updateProgress(10)

  // Resolve the fulfillment provider adapter from DB credentials
  const provider = await getProvider(product.providerId)

  await job.updateProgress(30)

  // Send the fulfillment request to the external provider
  const result = await provider.fulfillOrder({
    orderId,
    providerProductId: product.providerProductId,
    customerEmail:     order.customerEmail,
    amount:            Number(order.amount),
    currency:          order.currency,
  })

  await job.updateProgress(70)

  // Update order to PROCESSING with the provider's reference
  await OrderRepository.updateStatus(orderId, 'PROCESSING')
  if (result.providerOrderId) {
    await OrderRepository.setProviderOrderId(orderId, result.providerOrderId)
  }

  await job.updateProgress(100)

  return {
    status:          result.status === 'FAILED' ? 'FAILED' : 'COMPLETED',
    providerOrderId: result.providerOrderId ?? null,
  }
}

/**
 * Fulfillment Worker — runs in a separate process (src/worker.ts).
 * Call `startFulfillmentWorker()` once at process startup.
 */
export function startFulfillmentWorker(): Worker<FulfillmentJobData, FulfillmentJobResult> {
  const worker = new Worker<FulfillmentJobData, FulfillmentJobResult>(
    FULFILLMENT_QUEUE_NAME,
    processFulfillmentJob,
    {
      connection:  createRedisConnection(),
      concurrency: 5,
    }
  )

  worker.on('completed', (job, result) => {
    console.log(`[fulfillment] ✓ job ${job.id} done — order ${job.data.orderId}`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[fulfillment] ✗ job ${job?.id} failed — order ${job?.data.orderId}`, err.message)
  })

  return worker
}
