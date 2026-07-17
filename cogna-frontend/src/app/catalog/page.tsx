'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import PublicLayout from '@/components/layout/public-layout';
import ProductGrid, { type CatalogSort } from '@/components/product/product-grid';
import ProductDetailModal from '@/components/product/product-detail-modal';
import type { Product } from '@/components/product/product-card';
import type { Category } from '@/components/product/category-selector';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';

interface ProductListResponse { success: boolean; message?: string; data: Product[]; meta: { page: number; total: number; totalPages: number } }
const pageSize = 9;

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<CatalogSort>('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCartItem } = useCartStore();

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 280); return () => window.clearTimeout(timer); }, [search]);
  const loadCatalog = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const response = await api.get<ProductListResponse>('/products', { params: { page, limit: pageSize, ...(category ? { category } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) } });
      if (!response.data.success) throw new Error(response.data.message || 'The catalog could not be loaded.');
      setProducts(response.data.data); setTotal(response.data.meta.total); setTotalPages(Math.max(response.data.meta.totalPages, 1));
    } catch (requestError: unknown) { setProducts([]); setTotal(0); setTotalPages(1); setError(getErrorMessage(requestError, 'Unable to load the live catalog. Please try again.')); }
    finally { setLoading(false); }
  }, [category, debouncedSearch, page]);
  useEffect(() => { const timer = window.setTimeout(() => { void loadCatalog(); }, 0); return () => window.clearTimeout(timer); }, [loadCatalog]);
  useEffect(() => { let active = true; const timer = window.setTimeout(() => { void api.get<ProductListResponse>('/products', { params: { page: 1, limit: 100 } }).then((response) => { if (!active || !response.data.success) return; const unique = new Map<string, Category>(); response.data.data.forEach((product) => unique.set(product.category.id, product.category)); setCategories([...unique.values()]); }).catch(() => undefined); }, 0); return () => { active = false; window.clearTimeout(timer); }; }, []);
  const chooseCategory = (value: string | null) => { setCategory(value); setPage(1); };

  return <PublicLayout><main className="min-h-screen bg-[#062C23] px-5 py-14 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><div className="relative overflow-hidden rounded-[2rem] border border-emerald-100/15 bg-[linear-gradient(120deg,rgba(15,91,70,.5),rgba(6,44,35,.85))] px-6 py-12 shadow-premium-dark sm:px-10"><div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"/><div className="relative max-w-2xl"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.24em] text-[#F8D56B]"><Sparkles size={15}/> Cogna marketplace</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">Services that keep your digital life moving.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-emerald-100/70">Explore live product availability, compare options, and move confidently into a secure Cogna checkout.</p></div></div><section className="mt-10">{loading ? <div className="flex min-h-72 items-center justify-center rounded-3xl border border-emerald-100/15 bg-white/[0.04]"><RefreshCw className="animate-spin text-[#F8D56B]" size={28}/></div> : error ? <div className="rounded-3xl border border-rose-300/25 bg-rose-950/20 p-7"><p className="font-bold text-rose-100">Catalog unavailable</p><p className="mt-2 text-sm text-rose-100/70">{error}</p><button type="button" onClick={() => void loadCatalog()} className="mt-5 rounded-full border border-rose-200/30 px-4 py-2 text-xs font-bold text-rose-100">Try again</button></div> : <ProductGrid products={products} categories={categories} search={search} selectedCategory={category} sort={sort} page={page} totalPages={totalPages} total={total} onSearchChange={setSearch} onCategoryChange={chooseCategory} onSortChange={setSort} onPageChange={setPage} onAddToCart={(product) => { setCartItem(product); setSelectedProduct(product); }}/>}</section></div></main><ProductDetailModal product={selectedProduct} isOpen={selectedProduct !== null} onClose={() => setSelectedProduct(null)} onAddToCart={setCartItem}/></PublicLayout>;
}