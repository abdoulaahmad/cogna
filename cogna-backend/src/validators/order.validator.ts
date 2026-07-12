import { z } from 'zod'

export const createOrderSchema = z.object({
  productId:     z.string().uuid('Invalid product ID'),
  customerEmail: z.string().email('Invalid customer email'),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
