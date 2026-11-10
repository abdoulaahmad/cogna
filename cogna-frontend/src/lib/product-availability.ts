export function isProductAvailable(product: { active?: boolean; stock?: number | null } | null): boolean {
  return product !== null && product.active !== false && !(typeof product.stock === 'number' && product.stock <= 0);
}
