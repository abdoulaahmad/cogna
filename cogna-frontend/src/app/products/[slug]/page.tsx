'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, ShieldCheck, ShoppingBag } from 'lucide-react';
import PublicLayout from '@/components/layout/public-layout';
import type { Product } from '@/components/product/product-card';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { useCartStore } from '@/stores/cart';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  const { setCartItem } = useCartStore();
  useEffect(() => { let active = true; async function load() { setLoading(true); try { const response = await api.get<{ success: boolean; data: Product }>(`/products/slug/${encodeURIComponent(slug)}`); if (!response.data.success) throw new Error('This product is not currently available.'); if (active) setProduct(response.data.data); } catch (requestError: unknown) { if (active) setError(getErrorMessage(requestError, 'This product is not currently available.')); } finally { if (active) setLoading(false); } } void load(); return () => { active = false; }; }, [slug]);
  const price = product ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: product.currency || 'NGN', minimumFractionDigits: 0 }).format(Number(product.price)) : '';
  return <PublicLayout><main className="min-h-screen bg-[#062C23] px-5 py-14 text-white"><div className="mx-auto max-w-4xl"><Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/70 transition hover:text-[#F8D56B]"><ArrowLeft size={16}/> Back to marketplace</Link>{loading ? <div className="flex min-h-80 items-center justify-center"><RefreshCw className="animate-spin text-[#F8D56B]"/></div> : error ? <div className="mt-8 rounded-3xl border border-rose-300/20 bg-rose-950/20 p-7"><h1 className="text-xl font-bold">Product unavailable</h1><p className="mt-2 text-sm text-rose-100/70">{error}</p><Link href="/catalog" className="mt-5 inline-flex rounded-full bg-[#D4AF37] px-4 py-2 text-xs font-bold text-[#062C23]">Browse catalog</Link></div> : product ? <article className="mt-8 overflow-hidden rounded-[2rem] border border-emerald-100/15 bg-white/[0.07] p-7 shadow-premium-dark backdrop-blur-xl sm:p-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">{product.category.name}</p><h1 className="mt-4 max-w-2xl font-display text-4xl font-bold sm:text-5xl">{product.name}</h1><p className="mt-6 max-w-2xl text-base leading-8 text-emerald-100/70">{product.description || 'Product information is confirmed during checkout.'}</p><div className="mt-10 flex flex-col gap-6 border-t border-emerald-100/10 pt-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-100/45">Price</p><p className="mt-2 text-3xl font-bold">{price}</p></div><button type="button" disabled={product.active === false} onClick={() => setCartItem(product)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3.5 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-40"><ShoppingBag size={17}/>{product.active === false ? 'Unavailable' : 'Add to checkout'}</button></div><p className="mt-7 flex gap-2 text-xs text-emerald-100/60"><ShieldCheck size={16} className="shrink-0 text-[#F8D56B]"/>Payments and provider fulfillment are verified by Cogna before completion.</p></article> : null}</div></main></PublicLayout>;
}