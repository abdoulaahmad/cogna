// Product-related TypeScript interfaces

export interface ProductDto {
  id: string
  providerId: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  price: number
  currency: string
  deliveryTime: string | null
  image: string | null
  active: boolean
  paymentGateway: 'PAYSTACK' | 'MONNIFY'
  category?: CategoryDto
  createdAt: Date
}

export interface CategoryDto {
  id: string
  name: string
  slug: string
  description: string | null
}
