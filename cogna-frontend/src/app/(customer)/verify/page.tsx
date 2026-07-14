'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifiedRef = useRef(false);

  // Extract reference from either Paystack (?reference=...) or Monnify (?paymentReference=...) query string
  const reference = searchParams.get('reference') || searchParams.get('paymentReference');

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Avoid double-running in StrictMode
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment reference found in URL.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await api.get(`/payments/verify/${encodeURIComponent(reference)}`);

        if (response.data.success && response.data.data?.status === 'PAID') {
          setStatus('success');
        } else {
          setStatus('failed');
          setErrorMessage(response.data.message || 'Payment was not confirmed as paid.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMessage(
          err.response?.data?.message || 'Verification request failed. Server error.'
        );
        setStatus('failed');
      }
    };

    verifyPayment();
  }, [reference]);

  return (
    <GlassCard className="p-8 text-center space-y-6">
      {status === 'verifying' ? (
        <div className="flex flex-col items-center space-y-4 py-8">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <div>
            <h2 className="text-lg font-bold text-slate-800">Verifying Payment</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">
              Re-routing validation metrics back from gateway...
            </p>
          </div>
        </div>
      ) : null}

      {status === 'success' ? (
        <div className="flex flex-col items-center space-y-4 py-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 drop-shadow-[0_4px_10px_rgba(16,185,129,0.2)]" />
          <div>
            <h2 className="text-lg font-bold text-slate-800">Payment Confirmed</h2>
            <p className="text-xs font-semibold text-slate-500 mt-2 px-4 leading-relaxed">
              Your subscription is now active! API keys and usage credentials have been successfully provisioned.
            </p>
          </div>
          <div className="w-full pt-4 flex flex-col gap-2">
            <Link href="/keys" className="w-full">
              <Button className="w-full">Go to Developer Keys</Button>
            </Link>
            <Link href="/orders" className="w-full">
              <Button variant="secondary" className="w-full">
                View Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {status === 'failed' ? (
        <div className="flex flex-col items-center space-y-4 py-4">
          <XCircle className="h-16 w-16 text-rose-500 drop-shadow-[0_4px_10px_rgba(244,63,94,0.2)]" />
          <div>
            <h2 className="text-lg font-bold text-slate-800">Verification Failed</h2>
            <p className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg mt-3">
              {errorMessage || 'Payment confirmation timeout or reference mismatched.'}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 mt-3 px-4">
              If your account was debited, please wait a minute or contact support with reference: <br />
              <span className="font-bold text-slate-600 select-all">{reference || 'N/A'}</span>
            </p>
          </div>
          <div className="w-full pt-4 flex flex-col gap-2">
            <Link href="/" className="w-full">
              <Button variant="secondary" className="w-full">
                Back to Marketplace
                  </Button>
            </Link>
          </div>
        </div>
      ) : null}
    </GlassCard>
  );
}

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8 font-display">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <GlassCard className="p-8 text-center space-y-6">
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
              <div>
                <h2 className="text-lg font-bold text-slate-800">Loading</h2>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  Parsing checkout parameters...
                </p>
              </div>
            </div>
          </GlassCard>
        }>
          <VerifyContent />
        </Suspense>
      </div>
    </div>
  );
}
