import { buildApp } from './app'
import { env } from '@/config/env'
import { startFulfillmentWorker } from '@/queue/fulfillment.worker'
import { fulfillmentQueue } from '@/queue/fulfillment.queue'

async function start() {
  const app = await buildApp()
  startFulfillmentWorker()
  
  // Schedule the status polling job to run every 60 seconds
  try {
    await fulfillmentQueue.add(
      'poll-processing-orders',
      { orderId: '', productId: '', userId: '' },
      { repeat: { every: 60000 }, jobId: 'poll-processing-orders' }
    )
    console.log('🕒 Registered repeatable status polling job (every 60s)')
  } catch (err: any) {
    console.error('Failed to register repeatable polling job:', err.message)
  }

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' })
    console.log(`🚀 Cogna API running on port ${env.PORT}`)
    console.log(`📖 Docs available at http://localhost:${env.PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
