'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { ArrowLeft, CreditCard, Lock } from 'lucide-react';
import Link from 'next/link';

export default function PayPage() {
  const router = useRouter();
  const { cartItem, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: Redirect if not authenticated or no item in cart
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pay');
    } else if (!cartItem) {
      router.push('/');
    }
  }, [isAuthenticated, cartItem, router]);

  if (!isAuthenticated || !cartItem || !user) {
    return null; // Don't flash screen during redirect
  }

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Create order on the backend
      const orderResponse = await api.post('/orders', {
        productId: cartItem.id,
        customerEmail: user.email,
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.message || 'Order creation failed');
      }

      const order = orderResponse.data.data;

      // 2. Initialize payment with the gateway mapped to this product
      // We pass callbackUrl pointing to our frontend verify page
      const callbackUrl = `${window.location.origin}/verify`;
      
      const paymentResponse = await api.post('/payments/initialize', {
        orderId: order.id,
        gateway: cartItem.paymentGateway,
        callbackUrl,
      });

      if (!paymentResponse.data.success) {
        throw new Error(paymentResponse.data.message || 'Payment initialization failed');
      }

      const { authorizationUrl } = paymentResponse.data.data;

      // 3. Clear cart since order is initialized
      clearCart();

      // 4. Redirect to payment gateway authorization URL
      window.location.href = authorizationUrl;
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Payment flow failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: cartItem.currency || 'NGN',
    minimumFractionDigits: 0,
  }).format(parseFloat(cartItem.price));

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-display">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>

        <GlassCard className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="text-indigo-600" size={20} />
            Confirm Subscription
          </h2>

          {error ? (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-500 border border-rose-100">
              {error}
            </div>
          ) : null}

          {/* Product Recap */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 mb-6 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Product
                </span>
                <h3 className="text-sm font-bold text-slate-700 mt-0.5">{cartItem.name}</h3>
              </div>
              <span className="text-sm font-bold text-slate-800">{formattedPrice}</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 pt-2 border-t border-slate-200/40">
              <span>Billing Cycle</span>
              <span className="text-slate-700">Monthly</span>
            </div>

            <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
              <span>Gateway Channel</span>
              <span className="text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                {cartItem.paymentGateway}
              </span>
            </div>
          </div>

          {/* Pricing detail list */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Subtotal</span>
              <span>{formattedPrice}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Setup / Config Fee</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-100">
              <span>Total Amount</span>
              <span>{formattedPrice}</span>
            </div>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            className="w-full"
            isLoading={isLoading}
          >
            Authorize Payment
          </Button>

          {/* Secure disclaimer */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Lock size={12} className="text-emerald-500" />
            <span>Payments processed via secure encrypted channels</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
