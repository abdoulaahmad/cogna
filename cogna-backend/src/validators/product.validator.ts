import { z } from 'zod'

// ── List products query ──────────────────────────────────────────────────
export const listProductsSchema = z.object({
  category: z.string().optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(100).default(20),
  active:   z.coerce.boolean().optional(),
})

export type ListProductsQuery = z.infer<typeof listProductsSchema>
