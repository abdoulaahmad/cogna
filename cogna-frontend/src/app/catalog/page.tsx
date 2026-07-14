'use client';

import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/components/layout/public-layout';
import ProductGrid from '@/components/product/product-grid';
import ProductDetailModal from '@/components/product/product-detail-modal';
import type { Product } from '@/components/product/product-card';
import type { Category } from '@/components/product/category-selector';
import { useCartStore } from '@/stores/cart';
import { api } from '@/lib/api';

interface ProductListResponse {
  success: boolean;
  data: Product[];
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCartItem } = useCartStore();

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await api.get<ProductListResponse>('/products', { params: { limit: 100 } });
        if (!response.data.success) throw new Error('Unable to load the catalog');
        setProducts(response.data.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load the catalog');
      } finally {
        setIsLoading(false);
      }
    }

    void loadCatalog();
  }, []);

  const categories = useMemo<Category[]>(() => {
    const unique = new Map<string, Category>();
    products.forEach((product) => unique.set(product.category.id, product.category));
    return Array.from(unique.values());
  }, [products]);

  return (
    <PublicLayout>
      <main className="min-h-screen bg-slate-50 px-6 py-14 sm:px-12 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#18B88A]">Marketplace</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Browse AI subscriptions</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500">
            Choose the AI tools and subscriptions that fit your workflow. Prices and availability are live from Cogna.
          </p>

          <section className="mt-10">
            {isLoading ? <p className="text-sm font-semibold text-slate-500">Loading catalog…</p> : null}
            {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
            {!isLoading && !error ? (
              <ProductGrid
                products={products}
                categories={categories}
                onAddToCart={(product) => {
                  setCartItem(product);
                  setSelectedProduct(product);
                }}
              />
            ) : null}
          </section>
        </div>
      </main>
      <ProductDetailModal
        product={selectedProduct}
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={setCartItem}
      />
    </PublicLayout>
  );
}
