'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import { pollPaymentVerification, type VerifiedPayment } from '@/lib/payment-verification';
import { useCartStore } from '@/stores/cart';

function VerifyOrderPayment() {
  const params = useSearchParams();
  const reference = params.get('reference') || params.get('paymentReference');
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<{
    state: 'VERIFYING' | VerifiedPayment['status'] | 'ERROR';
    message: string;
    orderId?: string;
  }>({ state: 'VERIFYING', message: 'Confirming your payment with the gateway.' });

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    // Cleanup cancels this run, including Strict Mode's initial effect replay.
    const timer = window.setTimeout(() => {
      setResult({ state: 'VERIFYING', message: 'Confirming your payment with the gateway.' });
      void pollPaymentVerification({
        signal: controller.signal,
        verify: async () => {
          const response = await api.get<{ success: boolean; data: VerifiedPayment }>(
            `/payments/verify/${encodeURIComponent(reference)}`, { signal: controller.signal },
          );
          if (!response.data.success || !['PENDING', 'PAID', 'FAILED', 'REFUNDED'].includes(response.data.data?.status)) {
            throw new Error('The server could not confirm the payment status.');
          }
          return response.data.data;
        },
        onResult: (payment) => {
          if (payment.status === 'PAID') useCartStore.getState().clearCart();
          setResult({
            state: payment.status, orderId: payment.orderId,
            message: payment.status === 'PAID'
              ? 'Payment verified. Your order is queued for fulfillment.'
              : payment.status === 'PENDING'
                ? 'The gateway has not confirmed payment yet. We check automatically for about a minute. You can also check again below.'
                : payment.status === 'REFUNDED' ? 'This payment has been refunded.' : 'The gateway reported that this payment failed.',
          });
        },
        onError: (error) => setResult({ state: 'ERROR', message: getErrorMessage(error, 'Unable to confirm payment right now. Check again before making another payment.') }),
      });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [reference, retry]);

  const state = reference ? result.state : 'ERROR';
  const message = reference ? result.message : 'No payment reference was returned by the gateway.';
  const title = state === 'PAID' ? 'Payment confirmed.' : state === 'PENDING' ? 'Payment still pending.' : state === 'FAILED' ? 'Payment failed.' : state === 'REFUNDED' ? 'Payment refunded.' : state === 'ERROR' ? 'Unable to confirm payment.' : 'Verifying payment.';
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#062C23] px-5 py-16 text-white">
      <section aria-live="polite" className="w-full max-w-xl rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-8 text-center shadow-premium-dark backdrop-blur-xl">
        <div className="flex justify-center">
          {state === 'PAID' ? <CheckCircle2 className="text-emerald-300" size={56}/> : state === 'PENDING' ? <Clock3 className="text-amber-200" size={56}/> : state === 'VERIFYING' ? <Loader2 className="animate-spin text-[#F8D56B]" size={50}/> : <XCircle className="text-rose-300" size={56}/>}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Order payment</p>
        <h1 className="mt-3 font-display text-3xl font-bold">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-emerald-100/70">{message}</p>
        {reference && <p className="mt-5 break-all text-xs text-emerald-100/45">Reference: {reference}</p>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {reference && (state === 'PENDING' || state === 'ERROR') && <button onClick={() => setRetry((value) => value + 1)} className="rounded-full border border-emerald-100/15 px-6 py-3 text-sm font-bold">Check again</button>}
          <Link href={result.orderId ? `/orders/${result.orderId}` : '/orders'} className="rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B]">{result.orderId ? 'View order' : 'View orders'}</Link>
          <Link href="/catalog" className="rounded-full border border-emerald-100/15 px-6 py-3 text-sm font-bold text-emerald-100 hover:border-[#D4AF37]">Marketplace</Link>
        </div>
        <p className="mt-6 flex justify-center gap-2 text-xs text-emerald-100/55"><ShieldCheck className="text-[#F8D56B]" size={15}/>Fulfillment only begins after a verified payment.</p>
      </section>
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#062C23] text-white"><Loader2 className="animate-spin"/></main>}><VerifyOrderPayment/></Suspense>;
}
