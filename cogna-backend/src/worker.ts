/**
 * Cogna Worker Process
 *
 * Runs separately from the main API server.
 * Start with: `npx ts-node-dev -r tsconfig-paths/register src/worker.ts`
 * Or in production: `node dist/worker.js`
 */
import 'dotenv/config'
import { getErrorMessage } from '@/utils/error-message';
import { startFulfillmentWorker } from '@/queue/fulfillment.worker'
import { fulfillmentQueue } from '@/queue/fulfillment.queue'

const worker = startFulfillmentWorker()

console.log('ðŸš€ Cogna worker started â€” waiting for jobs...')

// Schedule the status polling job to run every 60 seconds
void (async () => {
  try {
    await fulfillmentQueue.add(
      'poll-processing-orders',
      // We pass stub values to satisfy typescript definition if needed
      { orderId: '', productId: '', userId: '' },
      {
        repeat: { every: 60000 },
        jobId: 'poll-processing-orders',
      }
    )
    console.log('ðŸ•’ Registered repeatable status polling job (every 60s)')
  } catch (err: unknown) {
    console.error('Failed to register repeatable polling job:', getErrorMessage(err))
  }
})()

// Graceful shutdown
async function shutdown() {
  console.log('â³ Shutting down worker...')
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', () => { void shutdown() })
process.on('SIGINT',  () => { void shutdown() })
