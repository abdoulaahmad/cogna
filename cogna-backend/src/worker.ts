/**
 * Cogna Worker Process
 *
 * Runs separately from the main API server.
 * Start with: `npx ts-node-dev -r tsconfig-paths/register src/worker.ts`
 * Or in production: `node dist/worker.js`
 */
import 'dotenv/config'
import { startFulfillmentWorker } from '@/queue/fulfillment.worker'

const worker = startFulfillmentWorker()

console.log('🚀 Cogna worker started — waiting for jobs...')

// Graceful shutdown
async function shutdown() {
  console.log('⏳ Shutting down worker...')
  await worker.close()
  process.exit(0)
}

process.on('SIGTERM', () => { void shutdown() })
process.on('SIGINT',  () => { void shutdown() })
