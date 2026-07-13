import { z } from 'zod'

// ─── Initialize Payment ───────────────────────────────────────────────────────
export const initializePaymentSchema = z.object({
  orderId:     z.string().uuid('orderId must be a valid UUID'),
  callbackUrl: z.string().url('callbackUrl must be a valid URL').optional(),
})

// ─── Types ────────────────────────────────────────────────────────────────────
export type InitializePaymentInput = z.infer<typeof initializePaymentSchema>
