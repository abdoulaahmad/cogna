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
    <div className="fixed inset-0 z-[60] flex justify-end font-display">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#02150f]/80 backdrop-blur-sm" onClick={onClose} />

      {/* Slide drawer container */}
      <div className="relative w-full max-w-md h-full bg-[#0b3027] shadow-2xl flex flex-col justify-between z-10 border-l border-emerald-100/15 animate-[slideInRight_0.2s_ease-out] text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-emerald-100/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#F8D56B]" />
            <h2 className="text-base font-bold text-white">Your Checkout Cart</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-emerald-100/15 text-emerald-100/70 hover:text-white hover:bg-white/5 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow p-6 overflow-y-auto">
          {cartItem ? (
            <div className="space-y-6">
              {/* Product Info Card */}
              <GlassCard className="p-4 border-emerald-100/15 bg-white/[0.04]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-bold text-[#F8D56B] uppercase tracking-[.16em]">
                      {cartItem.category.name}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-1">{cartItem.name}</h3>
                  </div>
                  <span className="text-sm font-bold text-white">{formattedPrice}</span>
                </div>
                
                <p className="text-xs font-semibold text-emerald-100/60 mt-3">
                  Checkout: <span className="text-[#F8D56B] font-bold">Secure payment required</span>
                </p>
              </GlassCard>

              {/* Checkout details */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-emerald-100/45 uppercase tracking-[.16em]">Order Summary</h4>
                <div className="space-y-2 border-b border-emerald-100/10 pb-3 text-xs font-semibold text-emerald-100/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provisioning Fee</span>
                    <span className="text-[#F8D56B]">Free</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-1">
                  <span>Total Amount</span>
                  <span>{formattedPrice}</span>
                </div>
              </div>

              {/* Security info */}
              <div className="p-4 bg-black/15 border border-emerald-100/10 rounded-xl text-xs font-semibold leading-5 text-emerald-100/60 flex gap-3">
                <CreditCard size={15} className="text-[#F8D56B] shrink-0 mt-0.5" />
                <span>
                  Checkout creates a payment request. Cogna confirms payment before provider fulfillment begins.
                </span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-5 rounded-full bg-emerald-100/5 text-[#F8D56B] border border-emerald-100/10">
                <ShoppingBag size={32} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Your cart is empty</p>
                <p className="text-xs font-semibold text-emerald-100/60 mt-2">Select an AI subscription plan to begin checking out.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-emerald-100/10 bg-black/10 space-y-3">
          {cartItem ? (
            <>
              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#F8D56B] text-[#062C23] py-4 px-4 rounded-full text-sm font-bold transition focus:outline-none"
              >
                Proceed to Checkout
                <ArrowRight size={16} />
              </button>
              <button
                onClick={clearCart}
                className="w-full text-center text-xs font-bold text-emerald-100/50 hover:text-white transition py-2"
              >
                Clear Cart
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-white/[0.07] hover:bg-white/[0.1] text-white py-4 px-4 rounded-full text-xs font-bold transition focus:outline-none border border-emerald-100/15"
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
