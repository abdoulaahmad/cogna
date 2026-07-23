import { z } from 'zod'

const pinField = z.string().regex(/^\d{6}$/, 'PIN must be exactly 6 digits')

// ── Set / Change PIN ─────────────────────────────────────────────────────────
// Caller proves identity with EITHER currentPin OR account password.
// On first-time set: provide password (no existing PIN to compare).
// On change: either currentPin OR password is accepted.
export const setPinSchema = z
  .object({
    newPin:     pinField,
    currentPin: pinField.optional(),
    password:   z.string().min(1).optional(),
  })
  .refine(
    (data) => data.currentPin !== undefined || data.password !== undefined,
    { message: 'Provide either your current PIN or account password to set a new PIN' }
  )

// ── Verify PIN (internal / checkout use) ─────────────────────────────────────
export const verifyPinSchema = z.object({
  pin: pinField,
})

// ── Enable / Disable PIN requirement ─────────────────────────────────────────
// Enabling: no proof required (safe to re-enable).
// Disabling: currentPin OR password required.
export const pinStatusSchema = z
  .object({
    enabled:    z.boolean(),
    currentPin: pinField.optional(),
    password:   z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.enabled === true ||
      data.currentPin !== undefined ||
      data.password !== undefined,
    {
      message:
        'Provide your current PIN or account password to disable PIN protection',
    }
  )

export type SetPinInput     = z.infer<typeof setPinSchema>
export type PinStatusInput  = z.infer<typeof pinStatusSchema>
