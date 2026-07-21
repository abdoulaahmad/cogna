import prisma from './src/config/database'
import { WalletRepository } from './src/repositories/wallet.repository'
import { fulfillmentQueue } from './src/queue/fulfillment.queue'
import { randomUUID } from 'crypto'

async function cancelPendingOrders() {
  console.log('Clearing Redis fulfillment queue...')
  await fulfillmentQueue.obliterate({ force: true })
  console.log('Queue cleared!')

  console.log('Finding all PENDING orders...')
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING' }
  })

  console.log(`Found ${pendingOrders.length} pending orders.`)

  for (const order of pendingOrders) {
    console.log(`Refunding order ${order.id}...`)
    try {
      await WalletRepository.refundPurchase({
        userId: order.userId,
        orderId: order.id,
        reason: 'Manually cancelled by admin to prevent accidental trigger',
        idempotencyKey: 'cancel_' + order.id + '_' + randomUUID()
      })

      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'FAILED' }
      })
      console.log(`Successfully refunded and failed order ${order.id}`)
    } catch (err) {
      console.error(`Failed to cancel order ${order.id}:`, err)
    }
  }

  console.log('Done!')
  await prisma.$disconnect()
  process.exit(0)
}

cancelPendingOrders().catch(console.error)
