import React from 'react';
import { X, MessageSquare, ImageIcon, Mic, Code2, ShoppingCart, Star } from 'lucide-react';
import type { Product } from './product-card';
import GlassCard from '../ui/glass-card';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductDetailModal({ product, isOpen, onClose, onAddToCart }: ProductDetailModalProps) {
  if (!isOpen || !product) return null;

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
        return <MessageSquare className="h-10 w-10 text-indigo-500" />;
      case 'computer-vision':
      case 'image':
        return <ImageIcon className="h-10 w-10 text-purple-500" />;
      case 'voice-audio':
      case 'audio':
        return <Mic className="h-10 w-10 text-pink-500" />;
      default:
        return <Code2 className="h-10 w-10 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <GlassCard className="relative w-full max-w-lg p-6 sm:p-8 animate-[scaleIn_0.2s_ease-out] z-10 font-display">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
        >
          <X size={16} />
        </button>

        {/* Modal Content */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            {/* Category Icon Block */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {getCategoryIcon(product.category.slug)}
            </div>
            
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {product.category.name}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-1">
                {product.name}
              </h2>
              {/* Star Rating */}
              <div className="flex items-center gap-1 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className={i < 4 ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                ))}
                <span className="text-[10px] font-bold text-slate-400 ml-1.5">(4.0 rating)</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h3>
            <p className="text-sm font-semibold text-slate-600 leading-relaxed">
              {product.description || 'Access high-performance developer integration points for subscribing clients. Fully integrated with standard API keys, robust rate limits, and custom client monitoring dashboards.'}
            </p>
          </div>

          {/* Technical Specifications */}
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Payment Gateway</span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50 w-fit block mt-1">
                {product.paymentGateway}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">API Access Status</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit block mt-1">
                Active / Stable
              </span>
            </div>
          </div>

          {/* Footer: Price & Add to Cart button */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">Subscription Price</span>
              <span className="text-2xl font-bold text-slate-800 mt-1 block">
                {formattedPrice}
                <span className="text-xs font-bold text-slate-400"> / month</span>
              </span>
            </div>
            
            <button
              onClick={() => {
                onAddToCart?.(product);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition font-bold text-xs shadow-sm border border-indigo-700/10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <ShoppingCart size={15} />
              Subscribe Now
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

export default ProductDetailModal;
