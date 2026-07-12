// Product filter/query interfaces

export interface ProductFiltersDto {
  categorySlug?: string
  search?: string
  active?: boolean
  page?: number
  limit?: number
}
