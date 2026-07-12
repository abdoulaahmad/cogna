// Order-related TypeScript interfaces

export interface CreateOrderDto {
  productId: string
  customerEmail: string
}

export interface OrderDto {
  id: string
  userId: string
  productId: string
  providerId: string
  providerOrderId: string | null
  status: OrderStatus
  amount: number
  currency: string
  customerEmail: string
  createdAt: Date
  updatedAt: Date
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
