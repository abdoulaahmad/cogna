import prisma from '@/config/database'
import type { Prisma } from '@prisma/client'
import type { PaymentGatewayType } from '@/types/payment-gateway.types'

export const WalletRepository = {
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