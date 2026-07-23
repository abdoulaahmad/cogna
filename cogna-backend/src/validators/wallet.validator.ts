import { z } from 'zod'
export const initializeWalletFundingSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  currency: z.string().length(3).default('NGN'),
  gateway: z.enum(['PAYSTACK', 'MONNIFY', 'PLISIO']),
  idempotencyKey: z.string().min(16).max(128),
  callbackUrl: z.string().url().optional(),
})
export const walletPurchaseSchema = z.object({
  productId:      z.string().uuid(),
  customerEmail:  z.string().email(),
  idempotencyKey: z.string().min(16).max(128),
  transactionPin: z.string().regex(/^\d{6}$/).optional(),
})

export const walletRefundSchema = z.object({ orderId: z.string().uuid(), reason: z.string().min(3).max(500), idempotencyKey: z.string().min(16).max(128) })

export const initializeCryptoFundingSchema = z.object({
  usdtAmount: z.number().positive().min(1).max(100_000),
  idempotencyKey: z.string().min(16).max(128),
  callbackUrl: z.string().url().optional(),
})
