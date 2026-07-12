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
        orderBy: { createdAt: 'desc' },
        skip:  (opts.page - 1) * opts.limit,
        take:  opts.limit,
      }),
      prisma.product.count({ where }),
    ])

    return { items, total }
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
      orderBy: { createdAt: 'desc' },
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
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
  },
}
