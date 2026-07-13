import { z } from 'zod'

// ─── Category ─────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name:        z.string().min(2).max(100),
  slug:        z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  description: z.string().optional(),
})

export const updateCategorySchema = createCategorySchema.partial()

// ─── Provider ─────────────────────────────────────────────────────────────────
export const createProviderSchema = z.object({
  name:      z.string().min(2).max(100),
  baseUrl:   z.string().url(),
  apiKey:    z.string().min(1),
  apiSecret: z.string().optional(),
  apiConfig: z.record(z.string(), z.unknown()).optional(),
  status:    z.string().default('ACTIVE').transform((v) => v as 'ACTIVE' | 'INACTIVE'),
})

export const updateProviderSchema = createProviderSchema.partial()

// ─── Types ────────────────────────────────────────────────────────────────────
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateProviderInput = z.infer<typeof createProviderSchema>
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>
