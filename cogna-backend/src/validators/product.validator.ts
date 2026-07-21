import { z } from 'zod'

// ─── List products query ──────────────────────────────────────────────────────
export const listProductsSchema = z.object({
  category: z.string().optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(100).default(20),
  active:   z.coerce.boolean().optional(),
})

// ─── Create product (admin) ───────────────────────────────────────────────────
export const createProductSchema = z.object({
  providerId:          z.string().uuid(),
  providerProductId:   z.string().min(1),
  categoryId:          z.string().uuid(),
  name:                z.string().min(2).max(200),
  slug:                z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  description:         z.string().optional(),
  price:               z.number().positive(),
  currency:            z.string().length(3).default('NGN'),
  deliveryTime:        z.string().optional(),
  image:               z.string().url().optional(),
  position:            z.number().int().min(0).default(0),
  active:              z.boolean().default(true),
  paymentGateway:      z.string().default('PAYSTACK').transform((v) => v as 'PAYSTACK' | 'MONNIFY'),
  providerApiOverride: z.record(z.string(), z.string()).optional(),
})

// ─── Update product (admin) ───────────────────────────────────────────────────
export const updateProductSchema = createProductSchema.partial()

// ─── Reorder products (admin) ─────────────────────────────────────────────────
export const reorderProductsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ).min(1),
})

// ─── Types ────────────────────────────────────────────────────────────────────
export type ListProductsQuery    = z.infer<typeof listProductsSchema>
export type CreateProductInput   = z.infer<typeof createProductSchema>
export type UpdateProductInput   = z.infer<typeof updateProductSchema>
export type ReorderProductsInput = z.infer<typeof reorderProductsSchema>
