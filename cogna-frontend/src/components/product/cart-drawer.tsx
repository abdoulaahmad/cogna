import React from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { X, ShoppingBag, CreditCard, ArrowRight } from 'lucide-react';
import GlassCard from '../ui/glass-card';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { cartItem, clearCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    if (!isAuthenticated) {
      router.push('/login?redirect=/pay');
    } else {
      router.push('/pay');
    }
  };

  const formattedPrice = cartItem
    ? new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: cartItem.currency || 'NGN',
        minimumFractionDigits: 0,
      }).format(parseFloat(cartItem.price))
    : '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-display">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />

      {/* Slide drawer container */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between z-10 border-l border-slate-200 animate-[slideInRight_0.2s_ease-out]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">Your Checkout Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-6 overflow-y-auto">
          {cartItem ? (
            <div className="space-y-6">
              {/* Product Info Card */}
              <GlassCard className="p-4 border-slate-200/50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">
                      {cartItem.category.name}
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 mt-0.5">{cartItem.name}</h3>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{formattedPrice}</span>
                </div>
                
                <p className="text-xxs font-semibold text-slate-400 mt-3">
                  Checkout: <span className="text-slate-600 font-bold">Secure payment required</span>
                </p>
              </GlassCard>

              {/* Checkout details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Summary</h4>
                <div className="space-y-2 border-b border-slate-100 pb-3 text-xs font-semibold text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provisioning Fee</span>
                    <span className="text-emerald-600">Free</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-800 pt-1">
                  <span>Total Amount</span>
                  <span>{formattedPrice}</span>
                </div>
              </div>

              {/* Security info */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-lg text-xxs font-semibold text-slate-500 flex gap-2">
                <CreditCard size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  Checkout creates a payment request. Cogna confirms payment before provider fulfillment begins.
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                <ShoppingBag size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Your cart is empty</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">Select an AI subscription plan to begin checking out.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
          {cartItem ? (
            <>
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl text-xs font-bold shadow-sm transition border border-indigo-700/10 focus:outline-none"
              >
                Proceed to Checkout
                <ArrowRight size={14} />
              </button>
              <button
                onClick={clearCart}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Clear Cart
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-xl text-xs font-bold transition focus:outline-none"
            >
              Continue Browsing
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default CartDrawer;
