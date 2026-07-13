import prisma from '@/config/database'
import type { Category } from '@prisma/client'

export const CategoryRepository = {

  /** Get all categories ordered by name */
  async findAll(): Promise<Category[]> {
    return prisma.category.findMany({ orderBy: { name: 'asc' } })
  },

  /** Find a category by UUID */
  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } })
  },

  /** Find a category by slug */
  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { slug } })
  },

  /** Create a new category (admin only) */
  async create(data: { name: string; slug: string; description?: string }): Promise<Category> {
    return prisma.category.create({ data })
  },

  /** Update a category (admin only) */
  async update(
    id:   string,
    data: Partial<{ name: string; slug: string; description: string }>
  ): Promise<Category> {
    return prisma.category.update({ where: { id }, data })
  },

  /** Delete a category (admin only — only if no products reference it) */
  async delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } })
  },
}
