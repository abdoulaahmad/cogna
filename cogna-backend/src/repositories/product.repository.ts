import prisma from '@/config/database'
import type { Product, Category } from '@prisma/client'

export type ProductWithCategory = Product & { category: Category }

export const ProductRepository = {

  /** Find all active products with optional filters and pagination */
  async findAll(opts: {
    categorySlug?: string
    search?: string
    active?: boolean
    page: number
    limit: number
  }): Promise<{ items: ProductWithCategory[]; total: number }> {
    const where = {
      ...(opts.active !== undefined && { active: opts.active }),
      ...(opts.search && {
        OR: [
          { name:        { contains: opts.search, mode: 'insensitive' as const } },
          { description: { contains: opts.search, mode: 'insensitive' as const } },
        ],
      }),
      ...(opts.categorySlug && { category: { slug: opts.categorySlug } }),
    }

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
        skip:  (opts.page - 1) * opts.limit,
        take:  opts.limit,
      }),
      prisma.product.count({ where }),
    ])

    return { items, total }
  },

  /** Admin-only: return ALL products (no active filter, no limit) sorted by position */
  async findAllAdmin(): Promise<{ items: ProductWithCategory[]; total: number }> {
    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({
        include: { category: true },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      }),
      prisma.product.count(),
    ])
    return { items, total }
  },

  /** Return the next available position (max existing position + 1) */
  async getNextPosition(): Promise<number> {
    const result = await prisma.product.aggregate({ _max: { position: true } })
    return (result._max.position ?? -1) + 1
  },

  /** Find a single product by its UUID */
  async findById(id: string): Promise<ProductWithCategory | null> {
    return prisma.product.findUnique({
      where:   { id },
      include: { category: true },
    })
  },

  /** Find a single product by its URL slug */
  async findBySlug(slug: string): Promise<ProductWithCategory | null> {
    return prisma.product.findUnique({
      where:   { slug },
      include: { category: true },
    })
  },

  /** Find all products belonging to a category slug */
  async findByCategory(categorySlug: string): Promise<ProductWithCategory[]> {
    return prisma.product.findMany({
      where:   { category: { slug: categorySlug }, active: true },
      include: { category: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    })
  },

  /** Full-text search across name and description */
  async search(query: string): Promise<ProductWithCategory[]> {
    return prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name:        { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { category: true },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      take:    50,
    })
  },

  /** Create a new product (admin only) */
  async create(data: {
    providerId:          string
    providerProductId:   string
    categoryId:          string
    name:                string
    slug:                string
    description?:        string
    price:               number
    currency:            string
    deliveryTime?:       string
    image?:              string
    position?:           number
    active:              boolean
    paymentGateway:      'PAYSTACK' | 'MONNIFY'
    providerApiOverride?: Record<string, string>
  }): Promise<ProductWithCategory> {
    return prisma.product.create({
      data:    { ...data },
      include: { category: true },
    })
  },

  /** Update product fields (admin only) */
  async update(
    id:   string,
    data: Partial<{
      providerId:          string
      providerProductId:   string
      categoryId:          string
      name:                string
      slug:                string
      description:         string
      price:               number
      currency:            string
      deliveryTime:        string
      image:               string
      position:            number
      active:              boolean
      paymentGateway:      'PAYSTACK' | 'MONNIFY'
      providerApiOverride: Record<string, string>
    }>
  ): Promise<ProductWithCategory> {
    return prisma.product.update({
      where:   { id },
      data,
      include: { category: true },
    })
  },

  /** Batch update positions for products (admin only) */
  async reorderBatch(items: Array<{ id: string; position: number }>): Promise<void> {
    await prisma.$transaction(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data:  { position: item.position },
        })
      )
    )
  },

  /** Soft-delete a product by setting active = false (admin only) */
  async softDelete(id: string): Promise<ProductWithCategory> {
    return prisma.product.update({
      where:   { id },
      data:    { active: false },
      include: { category: true },
    })
  },
}
