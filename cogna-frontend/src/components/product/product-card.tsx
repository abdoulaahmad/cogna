import React from 'react';
import Link from 'next/link';
import { MessageSquare, ImageIcon, Mic, Code2, ShoppingCart, Star } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: string;
  currency: string;
  description?: string;
  slug: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  image?: string;
  paymentGateway: 'PAYSTACK' | 'MONNIFY';
  active?: boolean;
}

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  badge?: 'BEST SELLER' | 'TRENDING' | 'NEW ARRIVAL';
}

export function ProductCard({ product, onAddToCart, badge }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: product.currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(parseFloat(product.price));

  // Determine category icon
  const getCategoryIcon = (slug: string) => {
    switch (slug.toLowerCase()) {
      case 'natural-language':
      case 'text':
        return <MessageSquare className="h-8 w-8 text-indigo-500" />;
      case 'computer-vision':
      case 'image':
        return <ImageIcon className="h-8 w-8 text-purple-500" />;
      case 'voice-audio':
      case 'audio':
        return <Mic className="h-8 w-8 text-pink-500" />;
      default:
        return <Code2 className="h-8 w-8 text-slate-500" />;
    }
  };

  // Determine badge colors
  const badgeStyles = {
    'BEST SELLER': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'TRENDING': 'bg-purple-50 text-purple-600 border-purple-100',
    'NEW ARRIVAL': 'bg-pink-50 text-pink-600 border-pink-100',
  };

  return (
    <div className="group relative rounded-xl border border-slate-200/80 bg-white p-5 transition-all duration-300 hover:shadow-premium hover:-translate-y-1 flex flex-col justify-between h-[360px]">
      <div>
        {/* Card Header: Category & Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {product.category.name}
          </span>
          {badge ? (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles[badge]}`}>
              {badge}
            </span>
          ) : null}
        </div>

        {/* Card Body: Floating SVG Graphic / Category Icon */}
        <div className="relative w-full h-32 rounded-lg bg-slate-50 flex items-center justify-center mb-4 overflow-hidden border border-slate-100/50 group-hover:bg-slate-100/50 transition-colors">
          <div className="transition-transform duration-300 group-hover:scale-110">
            {getCategoryIcon(product.category.slug)}
          </div>
          {/* Subtle curved background lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent opacity-60 pointer-events-none" />
        </div>

        {/* Card Description */}
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="text-base font-bold font-display text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Mock Rating */}
        <div className="flex items-center gap-1 mt-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={11} className={i < 4 ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
          ))}
          <span className="text-[10px] font-bold text-slate-400 ml-1">(4.0)</span>
        </div>

        <p className="text-xs font-semibold text-slate-500 line-clamp-2 leading-relaxed">
          {product.description || 'Access high-performance developer integration points for subscribing clients.'}
        </p>
      </div>

      {/* Card Footer: Price & Add to Cart button */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div>
          <span className="block text-xs font-bold text-slate-400 uppercase leading-none">Price</span>
          <span className="text-base font-bold text-slate-800 font-display">{formattedPrice}</span>
        </div>
        
        <button
          onClick={() => onAddToCart?.(product)}
          className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm border border-indigo-700/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          title="Add to Cart"
        >
          <ShoppingCart size={15} />
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
