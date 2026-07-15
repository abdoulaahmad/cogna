import { z } from 'zod'
export const initializeWalletFundingSchema = z.object({
  amount: z.number().positive().max(1_000_000),
  currency: z.string().length(3).default('NGN'),
  gateway: z.enum(['PAYSTACK', 'MONNIFY']),
  idempotencyKey: z.string().min(16).max(128),
  callbackUrl: z.string().url().optional(),
})