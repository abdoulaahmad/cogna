import prisma from './src/config/database'
async function check() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 })
  console.log(JSON.stringify(orders, null, 2))
  process.exit(0)
}
check()
