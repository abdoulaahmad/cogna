export function isProductAvailable(product: { active?: boolean; stock?: number | null; available?: boolean } | null): boolean {
  return product !== null && product.active !== false && product.available !== false && typeof product.stock === 'number' && Number.isFinite(product.stock) && product.stock > 0;
}
