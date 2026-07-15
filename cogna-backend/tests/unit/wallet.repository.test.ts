import { beforeEach, describe, expect, it, vi } from 'vitest'

const tx = {
  walletFunding: { findUnique: vi.fn(), update: vi.fn() },
  walletTransaction: { create: vi.fn() },
  wallet: { update: vi.fn() },
}

vi.mock('@/config/database', () => ({
  default: {
    wallet: { upsert: vi.fn() },
    walletFunding: { create: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  },
}))

import prisma from '@/config/database'
import { WalletRepository } from '@/repositories/wallet.repository'

const funding = {
  id: 'funding-1', walletId: 'wallet-1', userId: 'user-1', gateway: 'PAYSTACK',
  reference: 'fund_ref_1', idempotencyKey: 'idem_1', amount: 500, currency: 'NGN',
  status: 'PENDING', wallet: { id: 'wallet-1', availableBalance: 100 }, walletTransaction: null,
}

beforeEach(() => vi.clearAllMocks())

describe('WalletRepository', () => {
  it('creates a wallet once per user', async () => {
    vi.mocked(prisma.wallet.upsert).mockResolvedValue({ id: 'wallet-1', userId: 'user-1' } as never)

    await WalletRepository.getOrCreate('user-1')

    expect(prisma.wallet.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }))
  })

  it('creates a funding intent with an idempotency key', async () => {
    vi.mocked(prisma.walletFunding.create).mockResolvedValue(funding as never)

    await WalletRepository.createFunding({
      walletId: 'wallet-1', userId: 'user-1', gateway: 'PAYSTACK', reference: 'fund_ref_1',
      idempotencyKey: 'idem_1', amount: 500, currency: 'NGN',
    })

    expect(prisma.walletFunding.create).toHaveBeenCalledOnce()
  })

  it('credits a pending funding atomically and appends one ledger entry', async () => {
    tx.walletFunding.findUnique.mockResolvedValue(funding)
    tx.walletTransaction.create.mockResolvedValue({ id: 'ledger-1' })
    tx.walletFunding.update.mockResolvedValue({ ...funding, status: 'COMPLETED', walletTransactionId: 'ledger-1' })

    const result = await WalletRepository.creditFunding('funding-1', 'gateway-ref-1', { channel: 'card' })

    expect(result?.status).toBe('COMPLETED')
    expect(tx.walletTransaction.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ balanceBefore: 100, balanceAfter: 600, amount: 500 }),
    }))
    expect(tx.wallet.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ availableBalance: { increment: 500 } }),
    }))
  })

  it('does not duplicate a credit for an already completed funding', async () => {
    tx.walletFunding.findUnique.mockResolvedValue({ ...funding, status: 'COMPLETED', walletTransaction: { id: 'ledger-1' } })

    const result = await WalletRepository.creditFunding('funding-1', 'gateway-ref-1', {})

    expect(result.status).toBe('COMPLETED')
    expect(tx.walletTransaction.create).not.toHaveBeenCalled()
    expect(tx.wallet.update).not.toHaveBeenCalled()
  })
})