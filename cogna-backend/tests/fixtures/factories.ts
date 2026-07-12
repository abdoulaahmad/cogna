// Test data factories — reusable across all test files

import type { User, Order, Product, Payment } from '@prisma/client'

let idCounter = 0
const nextId = () => `test-uuid-${++idCounter}`

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id:            overrides.id ?? nextId(),
    fullName:      overrides.fullName ?? 'Test User',
    email:         overrides.email ?? `user${idCounter}@test.com`,
    passwordHash:  overrides.passwordHash ?? '$2a$12$hashedpassword',
    role:          overrides.role ?? 'CUSTOMER',
    status:        overrides.status ?? 'ACTIVE',
    emailVerified: overrides.emailVerified ?? false,
    createdAt:     overrides.createdAt ?? new Date('2026-01-01'),
    updatedAt:     overrides.updatedAt ?? new Date('2026-01-01'),
  }
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id:                  overrides.id ?? nextId(),
    providerId:          overrides.providerId ?? nextId(),
    providerProductId:   overrides.providerProductId ?? 'akunding-prod-1',
    categoryId:          overrides.categoryId ?? nextId(),
    name:                overrides.name ?? 'ChatGPT Plus',
    slug:                overrides.slug ?? 'chatgpt-plus',
    description:         overrides.description ?? 'ChatGPT Plus subscription',
    price:               overrides.price ?? (29.99 as unknown as Product['price']),
    currency:            overrides.currency ?? 'NGN',
    deliveryTime:        overrides.deliveryTime ?? '1-24 hours',
    image:               overrides.image ?? null,
    active:              overrides.active ?? true,
    paymentGateway:      overrides.paymentGateway ?? 'PAYSTACK',
    providerApiOverride: overrides.providerApiOverride ?? null,
    createdAt:           overrides.createdAt ?? new Date('2026-01-01'),
    updatedAt:           overrides.updatedAt ?? new Date('2026-01-01'),
  }
}

export function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    id:               overrides.id ?? nextId(),
    userId:           overrides.userId ?? nextId(),
    productId:        overrides.productId ?? nextId(),
    providerId:       overrides.providerId ?? nextId(),
    providerOrderId:  overrides.providerOrderId ?? null,
    status:           overrides.status ?? 'PENDING',
    amount:           overrides.amount ?? (9999 as unknown as Order['amount']),
    currency:         overrides.currency ?? 'NGN',
    customerEmail:    overrides.customerEmail ?? 'customer@test.com',
    providerResponse: overrides.providerResponse ?? null,
    createdAt:        overrides.createdAt ?? new Date('2026-01-01'),
    updatedAt:        overrides.updatedAt ?? new Date('2026-01-01'),
  }
}

export function buildPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id:               overrides.id ?? nextId(),
    orderId:          overrides.orderId ?? nextId(),
    userId:           overrides.userId ?? nextId(),
    gateway:          overrides.gateway ?? 'PAYSTACK',
    gatewayReference: overrides.gatewayReference ?? 'PSK_ref_12345',
    reference:        overrides.reference ?? `cogna_ref_${idCounter}`,
    amount:           overrides.amount ?? (9999 as unknown as Payment['amount']),
    currency:         overrides.currency ?? 'NGN',
    status:           overrides.status ?? 'PENDING',
    metadata:         overrides.metadata ?? null,
    paidAt:           overrides.paidAt ?? null,
    createdAt:        overrides.createdAt ?? new Date('2026-01-01'),
  }
}
