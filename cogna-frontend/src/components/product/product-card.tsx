import Link from 'next/link';
import { ArrowUpRight, Code2, ImageIcon, MessageSquare, Mic, ShoppingBag } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: string;
  currency: string;
  description?: string | null;
  slug: string;
  category: { id: string; name: string; slug: string };
  image?: string | null;
  paymentGateway: 'PAYSTACK' | 'MONNIFY';
  deliveryTime?: string | null;
  active?: boolean;
}

interface ProductCardProps { product: Product; onAddToCart?: (product: Product) => void }

function categoryIcon(slug: string) {
  const props = { size: 26, strokeWidth: 1.7 };
  if (slug.includes('language') || slug.includes('text')) return <MessageSquare {...props} />;
  if (slug.includes('vision') || slug.includes('image')) return <ImageIcon {...props} />;
  if (slug.includes('voice') || slug.includes('audio')) return <Mic {...props} />;
  return <Code2 {...props} />;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const price = new Intl.NumberFormat('en-NG', { style: 'currency', currency: product.currency || 'NGN', minimumFractionDigits: 0 }).format(Number(product.price));
  const available = product.active !== false;

  return (
    <article className="group flex min-h-[335px] flex-col rounded-3xl border border-emerald-100/15 bg-white/[0.07] p-5 shadow-premium-dark backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/45 hover:bg-white/[0.10]">
      <div className="flex items-start justify-between gap-4">
        {product.image ? (
          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-2xl object-cover border border-[#D4AF37]/25 bg-black/20" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F8D56B]">{categoryIcon(product.category.slug)}</span>
        )}
        <span className={available ? 'rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-200' : 'rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] text-rose-200'}>{available ? 'Available' : 'Unavailable'}</span>
      </div>
      <div className="mt-6 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#D4AF37]">{product.category.name}</p>
        <Link href={`/products/${product.slug}`} className="mt-2 block text-xl font-bold text-white transition group-hover:text-[#F8D56B]">{product.name}</Link>
        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-emerald-100/65">{product.description || 'Product details are provided by Cogna before checkout.'}</p>
      </div>
      <div className="mt-6 flex items-end justify-between border-t border-emerald-100/10 pt-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/45">Price</p><p className="mt-1 text-lg font-bold text-white">{price}</p></div>
        <button type="button" disabled={!available} onClick={() => onAddToCart?.(product)} className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-bold text-[#062C23] transition hover:bg-[#F8D56B] disabled:cursor-not-allowed disabled:opacity-45"><ShoppingBag size={15}/>{available ? 'Purchase' : 'Unavailable'}<ArrowUpRight size={14}/></button>
      </div>
    </article>
  );
}