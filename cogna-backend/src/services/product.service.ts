import { ProductRepository } from '@/repositories/product.repository'
import { NotFoundError } from '@/utils/errors'
import type { ListProductsQuery } from '@/validators/product.validator'

export function sanitizePublicProduct<T extends Record<string, unknown>>(product: T): T {
  if (!product) return product
  const copy = { ...product }
  delete copy.providerApiOverride
  return copy as T
}

export const ProductService = {

  /**
   * List all products with optional filters and pagination.
   */
  async listProducts(query: ListProductsQuery) {
    const { items, total } = await ProductRepository.findAll({
      categorySlug: query.category,
      search:       query.search,
      active:       query.active ?? true,
      page:         query.page,
      limit:        query.limit,
    })

    return {
      items: items.map(sanitizePublicProduct),
      total,
      page: query.page,
      limit: query.limit,
    }
  },

  /**
   * Get a single product by ID. Throws NotFoundError if missing.
   */
  async getProductById(id: string) {
    const product = await ProductRepository.findById(id)
    if (!product) throw new NotFoundError('Product')
    return sanitizePublicProduct(product)
  },

  /**
   * Get a single product by slug. Throws NotFoundError if missing.
   */
  async getProductBySlug(slug: string) {
    const product = await ProductRepository.findBySlug(slug)
    if (!product) throw new NotFoundError('Product')
    return sanitizePublicProduct(product)
  },

  /**
   * Get all products in a specific category.
   */
  async getProductsByCategory(categorySlug: string) {
    const products = await ProductRepository.findByCategory(categorySlug)
    return products.map(sanitizePublicProduct)
  },

  /**
   * Full-text search across product name and description.
   */
  async searchProducts(query: string) {
    if (!query || query.trim().length < 2) return []
    const products = await ProductRepository.search(query.trim())
    return products.map(sanitizePublicProduct)
  },
}
