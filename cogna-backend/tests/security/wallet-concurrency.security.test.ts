import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WalletRepository } from '@/repositories/wallet.repository'
import { WalletService } from '@/services/wallet.service'
import { ConflictError } from '@/utils/errors'
import { runConcurrent } from './helpers/security.helper'

const mockTx = {
  wallet: {
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  walletTransaction: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  walletFunding: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  refund: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/config/database', () => ({
  default: {
    wallet: { findUnique: vi.fn(), update: vi.fn() },
    walletFunding: { findUnique: vi.fn(), create: vi.fn() },
    product: { findUnique: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  },
}))

vi.mock('@/repositories/product.repository', () => ({
  ProductRepository: {
    findById: vi.fn(),
  },
}))

import prisma from '@/config/database'
import { ProductRepository } from '@/repositories/product.repository'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.$transaction).mockImplementation(async (cb: any) => cb(mockTx))
})

describe('Security Suite: Financial Ledger & Wallet Concurrency Security', () => {

  describe('Purchase Idempotency & Double-Spending Defenses', () => {
    it('returns existing order without duplicate debit when identical idempotency key is submitted', async () => {
      const existingOrder = { id: 'order-101', amount: 500 }
      mockTx.wallet.findUnique.mockResolvedValueOnce({
        id: 'wallet-1',
        userId: 'user-1',
        availableBalance: 1000,
        version: 1,
      })
      mockTx.walletTransaction.findUnique.mockResolvedValueOnce({
        id: 'tx-101',
        orderId: 'order-101',
        order: existingOrder,
      })

      const result = await WalletRepository.purchase({
        userId: 'user-1',
        productId: 'prod-1',
        providerId: 'prov-1',
        customerEmail: 'customer@example.com',
        amount: 500,
        currency: 'NGN',
        idempotencyKey: 'idempotent-key-repeat',
      })

      expect(result).toEqual(existingOrder)
      expect(mockTx.order.create).not.toHaveBeenCalled()
      expect(mockTx.wallet.updateMany).not.toHaveBeenCalled()
    })

    it('prevents purchase debit when available balance is strictly less than amount', async () => {
      mockTx.wallet.findUnique.mockResolvedValueOnce({
        id: 'wallet-1',
        userId: 'user-1',
        availableBalance: 200, // Insufficient for 500 purchase
        version: 1,
      })

      const result = await WalletRepository.purchase({
        userId: 'user-1',
        productId: 'prod-1',
        providerId: 'prov-1',
        customerEmail: 'customer@example.com',
        amount: 500,
        currency: 'NGN',
        idempotencyKey: 'key-insufficient',
      })

      expect(result).toBeNull()
      expect(mockTx.order.create).not.toHaveBeenCalled()
      expect(mockTx.wallet.updateMany).not.toHaveBeenCalled()
    })

    it('simulates parallel concurrent debits: only one purchase succeeds while subsequent concurrent calls are rejected', async () => {
      let simulatedBalance = 500 // Only enough for ONE purchase of 500
      let version = 1
      const purchaseAmount = 500

      // Mock transaction execution simulating CAS (Compare-And-Swap) optimistic concurrency control
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          wallet: {
            findUnique: vi.fn().mockImplementation(async () => {
              return { id: 'wallet-1', userId: 'user-1', availableBalance: simulatedBalance, version }
            }),
            updateMany: vi.fn().mockImplementation(async ({ where }) => {
              if (where.version === version && simulatedBalance >= purchaseAmount) {
                simulatedBalance -= purchaseAmount
                version += 1
                return { count: 1 }
              }
              return { count: 0 }
            }),
            update: vi.fn(),
          },
          walletTransaction: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: 'tx-1' }),
          },
          order: {
            create: vi.fn().mockResolvedValue({ id: `order-${Math.random()}`, amount: purchaseAmount }),
          },
        })
      })

      // Execute 5 concurrent purchase requests
      const results = await runConcurrent(async (i) => {
        return WalletRepository.purchase({
          userId: 'user-1',
          productId: 'prod-1',
          providerId: 'prov-1',
          customerEmail: 'user@example.com',
          amount: purchaseAmount,
          currency: 'NGN',
          idempotencyKey: `concurrent-key-${i}`,
        })
      }, 5)

      const fulfilledOrders = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value)

      // Only 1 order must have succeeded since balance was exactly 500
      expect(fulfilledOrders.length).toBe(1)
      expect(simulatedBalance).toBe(0)
    })
  })

  describe('Funding Credit Replay & Ledger Invariance', () => {
    it('rejects duplicate credit attempt for an already COMPLETED funding intent', async () => {
      mockTx.walletFunding.findUnique.mockResolvedValueOnce({
        id: 'funding-already-credited',
        status: 'COMPLETED',
        walletTransaction: { id: 'tx-already-exists' },
      })

      const res = await WalletRepository.creditFunding(
        'funding-already-credited',
        'paystack_txn_duplicate',
        { channel: 'card' }
      )

      expect(res?.status).toBe('COMPLETED')
      expect(mockTx.walletTransaction.create).not.toHaveBeenCalled()
      expect(mockTx.wallet.update).not.toHaveBeenCalled()
    })
  })

  describe('Compensating Refund Idempotency', () => {
    it('returns existing refund when identical idempotencyKey is used, preventing double-credit', async () => {
      const existingRefund = { id: 'refund-1', status: 'COMPLETED', amount: 500 }
      mockTx.refund.findUnique.mockResolvedValueOnce(existingRefund)

      const res = await WalletRepository.refundPurchase({
        userId: 'user-1',
        orderId: 'order-1',
        reason: 'Provider delivery timeout',
        idempotencyKey: 'refund-key-dup',
      })

      expect(res).toEqual(existingRefund)
      expect(mockTx.refund.create).not.toHaveBeenCalled()
      expect(mockTx.wallet.update).not.toHaveBeenCalled()
    })

    it('rejects refund if order does not belong to the user', async () => {
      mockTx.refund.findUnique.mockResolvedValueOnce(null)
      mockTx.order.findUnique.mockResolvedValueOnce({ id: 'order-1', status: 'PENDING' })
      mockTx.walletTransaction.findFirst.mockImplementation(async ({ where }: any) => {
        if (where?.type === 'REFUND') return null
        return {
          id: 'tx-1',
          walletId: 'wallet-rival',
          amount: 500,
          currency: 'NGN',
          order: { id: 'order-1', userId: 'rival-user' }, // Belongs to different user!
          wallet: { id: 'wallet-rival', availableBalance: 1000 },
        }
      })

      const res = await WalletRepository.refundPurchase({
        userId: 'user-1', // Attacker
        orderId: 'order-1',
        reason: 'Unauthorized refund attempt',
        idempotencyKey: 'key-attack-1',
      })

      expect(res).toBeNull()
      expect(mockTx.refund.create).not.toHaveBeenCalled()
    })
  })
})
