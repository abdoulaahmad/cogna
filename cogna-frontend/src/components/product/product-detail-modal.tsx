import { ArrowUpRight, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import type { Product } from './product-card';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

  const price = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(Number(product.price));

  const hasStock = product.stock !== undefined && product.stock !== null;
  const isOutOfStock = hasStock && (product.stock as number) <= 0;
  const available = product.active !== false && !isOutOfStock;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} details`}
      className="fixed inset-0 z-[60] flex items-end bg-[#02150f]/80 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
    >
      <button type="button" aria-label="Close product details" onClick={onClose} className="absolute inset-0" />
      <section className="relative w-full max-w-xl rounded-[2rem] border border-emerald-100/15 bg-[#0b3027] p-6 text-white shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-emerald-100/15 p-2 text-emerald-100/70 hover:text-white"
        >
          <X size={17} />
        </button>

        <div className="flex items-center gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#F8D56B]">
            {product.category.name}
          </p>
          {hasStock && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                (product.stock as number) <= 0
                  ? 'border border-rose-400/30 bg-rose-500/20 text-rose-300'
                  : (product.stock as number) <= 5
                  ? 'border border-amber-400/30 bg-amber-500/20 text-amber-300'
                  : 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {(product.stock as number) <= 0
                ? 'Out of stock'
                : (product.stock as number) <= 5
                ? `Only ${product.stock} left`
                : `${(product.stock as number).toLocaleString()} in stock`}
            </span>
          )}
        </div>

        <h2 className="mt-3 max-w-md pr-10 font-display text-3xl font-bold">{product.name}</h2>
        <p className="mt-5 text-sm leading-7 text-emerald-100/70">
          {product.description || 'Review this product’s details before continuing to secure checkout.'}
        </p>

        <div className="mt-7 grid gap-3 border-y border-emerald-100/10 py-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/45">Price</p>
            <p className="mt-1 text-2xl font-bold text-white">{price}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/45">Fulfillment</p>
            <p className="mt-1 text-sm font-bold text-emerald-100">
              {product.deliveryTime || 'Confirmed after checkout'}
            </p>
          </div>
        </div>

        <p className="mt-5 flex gap-2 text-xs leading-5 text-emerald-100/60">
          <ShieldCheck className="shrink-0 text-[#F8D56B]" size={16} />
          Availability and payment processing are confirmed by Cogna during checkout.
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-5 py-3 text-xs font-bold text-emerald-100/70"
          >
            Continue browsing
          </button>
          <button
            type="button"
            disabled={!available}
            onClick={() => {
              onAddToCart?.(product);
              onClose();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-45"
          >
            <ShoppingBag size={15} />
            {available ? 'Add to checkout' : isOutOfStock ? 'Out of stock' : 'Unavailable'}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}