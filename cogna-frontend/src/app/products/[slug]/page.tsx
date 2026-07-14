'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import PublicLayout from '@/components/layout/public-layout';
import type { Product } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setCartItem } = useCartStore();

  useEffect(() => {
    async function loadProduct() {
      try {
        const response = await api.get(`/products/slug/${encodeURIComponent(slug)}`);
        setProduct(response.data.data);
      } catch {
        setError('This product is not currently available.');
      }
    }

    void loadProduct();
  }, [slug]);

  return (
    <PublicLayout>
      <main className="min-h-screen bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">
          <Link href="/catalog" className="text-sm font-bold text-[#0F5B46]">
            ← Back to catalog
          </Link>

          {error ? <p className="mt-8 text-rose-600">{error}</p> : null}
          {!error && !product ? <p className="mt-8 text-slate-500">Loading product…</p> : null}

          {product ? (
            <div className="mt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#18B88A]">
                {product.category.name}
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-900">{product.name}</h1>
              <p className="mt-4 text-slate-600">
                {product.description || 'Product details will be provided during fulfillment.'}
              </p>
              <p className="mt-8 text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: product.currency,
                }).format(Number(product.price))}
              </p>
              <button
                type="button"
                onClick={() => setCartItem(product)}
                className="mt-6 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-slate-950"
              >
                Add to cart
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </PublicLayout>
  );
}