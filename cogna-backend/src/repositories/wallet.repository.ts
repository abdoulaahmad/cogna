import prisma from '@/config/database'
import type { Prisma } from '@prisma/client'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

export const WalletRepository = {
  findByUserId(userId: string) {
    return prisma.wallet.findUnique({ where: { userId } })
  },

  async findTransactionsByUserId(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet) return { items: [], total: 0 }
    const [items, total] = await prisma.$transaction([
      prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ])
    return { items, total }
  },
  getOrCreate(userId: string, currency = 'NGN') {
    return prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, currency },
    })
  },

  createFunding(input: {
    walletId: string; userId: string; gateway: PaymentGatewayType; reference: string
    idempotencyKey: string; amount: number; currency: string
  }) {
    return prisma.walletFunding.create({ data: input })
  },

  findFundingByIdempotencyKey(idempotencyKey: string) {
    return prisma.walletFunding.findUnique({ where: { idempotencyKey } })
  },

  findFundingByReference(reference: string) {
    return prisma.walletFunding.findUnique({ where: { reference } })
  },

  saveCheckout(fundingId: string, authorizationUrl: string, gatewayReference: string) {
    return prisma.walletFunding.update({
      where: { id: fundingId },
      data: { status: 'PENDING', authorizationUrl, gatewayReference },
    })
  },

  async purchase(input: { userId: string; productId: string; providerId: string; customerEmail: string; amount: number; currency: string; idempotencyKey: string }) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: input.userId } })
      if (!wallet || Number(wallet.availableBalance) < input.amount) return null
      const existing = await tx.walletTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { order: true } })
      if (existing?.order) return existing.order
      const order = await tx.order.create({ data: { userId: input.userId, productId: input.productId, providerId: input.providerId, amount: input.amount, currency: input.currency, customerEmail: input.customerEmail } })
      const before = Number(wallet.availableBalance)
      await tx.walletTransaction.create({ data: { walletId: wallet.id, orderId: order.id, type: 'PURCHASE', direction: 'DEBIT', amount: input.amount, currency: input.currency, balanceBefore: before, balanceAfter: before - input.amount, reference: `purchase_${order.id}`, idempotencyKey: input.idempotencyKey, source: 'WALLET' } })
      await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: input.amount }, lifetimeSpent: { increment: input.amount }, version: { increment: 1 } } })
      return order
    })
  },
  async refundPurchase(input: { userId: string; orderId: string; reason: string; idempotencyKey: string }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.refund.findUnique({ where: { idempotencyKey: input.idempotencyKey } })
      if (existing) return existing
      const purchase = await tx.walletTransaction.findFirst({ where: { orderId: input.orderId, type: 'PURCHASE', direction: 'DEBIT' }, include: { wallet: true, order: true } })
      if (!purchase || purchase.order?.userId !== input.userId) return null
      const before = Number(purchase.wallet.availableBalance)
      const refund = await tx.refund.create({ data: { userId: input.userId, orderId: input.orderId, walletId: purchase.walletId, amount: purchase.amount, currency: purchase.currency, reason: input.reason, status: 'COMPLETED', reference: `refund_${input.orderId}`, idempotencyKey: input.idempotencyKey } })
      const ledger = await tx.walletTransaction.create({ data: { walletId: purchase.walletId, orderId: input.orderId, type: 'REFUND', direction: 'CREDIT', amount: purchase.amount, currency: purchase.currency, balanceBefore: before, balanceAfter: before + Number(purchase.amount), reference: `refund_ledger_${refund.id}`, idempotencyKey: `refund_credit_${input.idempotencyKey}`, source: 'REFUND' } })
      await tx.wallet.update({ where: { id: purchase.walletId }, data: { availableBalance: { increment: purchase.amount }, lifetimeSpent: { decrement: purchase.amount }, version: { increment: 1 } } })
      return tx.refund.update({ where: { id: refund.id }, data: { walletTransactionId: ledger.id } })
    })
  },
  async creditFunding(fundingId: string, gatewayReference: string, metadata: Record<string, unknown>) {
    return prisma.$transaction(async (tx) => {
      const funding = await tx.walletFunding.findUnique({
        where: { id: fundingId }, include: { wallet: true, walletTransaction: true },
      })
      if (!funding) return null
      if (funding.status === 'COMPLETED') return funding

      const before = Number(funding.wallet.availableBalance)
      const after = before + Number(funding.amount)
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: funding.walletId, type: 'FUNDING', direction: 'CREDIT', amount: funding.amount,
          currency: funding.currency, balanceBefore: before, balanceAfter: after,
          reference: `ledger_${funding.reference}`, idempotencyKey: `credit_${funding.reference}`,
          externalReference: gatewayReference, source: 'GATEWAY', metadata: metadata as Prisma.InputJsonValue,
        },
      })
      await tx.wallet.update({
        where: { id: funding.walletId },
        data: { availableBalance: { increment: funding.amount }, lifetimeFunded: { increment: funding.amount }, version: { increment: 1 } },
      })
      return tx.walletFunding.update({
        where: { id: funding.id },
        data: { status: 'COMPLETED', gatewayReference, walletTransactionId: transaction.id, metadata: metadata as Prisma.InputJsonValue },
      })
    })
  },
}