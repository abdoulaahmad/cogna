import { z } from 'zod'

const paystackPublicKey = z.string().trim().regex(/^pk_(test|live)_[A-Za-z0-9]+$/, 'Enter a valid Paystack public key')
const paystackSecretKey = z.string().trim().regex(/^sk_(test|live)_[A-Za-z0-9]+$/, 'Enter a valid Paystack secret key')

export const updatePaystackConfigurationSchema = z.object({
  publicKey: z.union([paystackPublicKey, z.literal('')]).optional(),
  secretKey: paystackSecretKey.optional(),
  enabled: z.boolean(),
}).superRefine((value, context) => {
  if (value.publicKey && value.secretKey) {
    const publicMode = value.publicKey.startsWith('pk_live_') ? 'live' : 'test'
    const secretMode = value.secretKey.startsWith('sk_live_') ? 'live' : 'test'
    if (publicMode !== secretMode) context.addIssue({ code: 'custom', message: 'Paystack public and secret keys must use the same mode' })
  }
})

export type UpdatePaystackConfigurationInput = z.infer<typeof updatePaystackConfigurationSchema>