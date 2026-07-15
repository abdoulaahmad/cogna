import { Worker, type Job } from 'bullmq'
import { createRedisConnection } from '@/config/redis'
import { getProvider } from '@/providers/provider.factory'
import { OrderRepository } from '@/repositories/order.repository'
import { ProductRepository } from '@/repositories/product.repository'
import { FulfillmentService } from '@/services/fulfillment.service'
import type { FulfillmentJobData, FulfillmentJobResult } from '@/types/fulfillment-job.types'
import { FULFILLMENT_QUEUE_NAME } from '@/types/fulfillment-job.types'

async function processFulfillmentJob(
  job: Job<FulfillmentJobData, FulfillmentJobResult>
): Promise<FulfillmentJobResult> {
  if (job.name === 'poll-processing-orders') {
    await FulfillmentService.pollProcessingOrders()
    return { status: 'COMPLETED', providerOrderId: null }
  }

  const { orderId, productId } = job.data
  const order = await OrderRepository.findById(orderId)
  const product = await ProductRepository.findById(productId)

  if (!order || !product) {
    throw new Error(`Order or product not found: orderId=${orderId}`)
  }

  await job.updateProgress(10)
  const provider = await getProvider(product.providerId)
  await job.updateProgress(30)

  const result = await provider.fulfillOrder({
    orderId,
    providerProductId: product.providerProductId,
    customerEmail: order.customerEmail,
    amount: Number(order.amount),
    currency: order.currency,
  })

  await job.updateProgress(70)
  if (result.providerOrderId) {
    await OrderRepository.setProviderOrderId(orderId, result.providerOrderId)
  }
  await OrderRepository.setProviderResponse(orderId, result)
  await OrderRepository.updateStatus(orderId, result.status)
  await job.updateProgress(100)

  return { status: result.status, providerOrderId: result.providerOrderId ?? null }
}

export function startFulfillmentWorker(): Worker<FulfillmentJobData, FulfillmentJobResult> {
  const worker = new Worker<FulfillmentJobData, FulfillmentJobResult>(
    FULFILLMENT_QUEUE_NAME,
    processFulfillmentJob,
    { connection: createRedisConnection(), concurrency: 5 }
  )

  worker.on('completed', (job, result) => {
    console.log(`[fulfillment] completed job ${job.id} for order ${job.data.orderId}`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[fulfillment] failed job ${job?.id} for order ${job?.data.orderId}`, err.message)
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      void OrderRepository.updateStatus(job.data.orderId, 'FAILED')
    }
  })

  return worker
}