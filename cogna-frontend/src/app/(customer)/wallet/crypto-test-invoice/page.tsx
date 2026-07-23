'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bitcoin, CheckCircle2, Loader2, Info } from 'lucide-react';
import { api } from '@/lib/api';

function TestInvoiceContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulatePayment = async () => {
    if (!reference) return;
    setLoading(true);
    setError(null);
    try {
      // Create a mock payload matching Plisio's form data webhook
      // PlisioAdapter skips verify_hash check if PLISIO_TEST_MODE is true
      const payload = new URLSearchParams({
        status: 'completed',
        order_number: reference,
        txn_id: `test_txn_${reference}`,
        source_amount: '10',
        source_currency: 'USDT_BSC'
      }).toString();

      await api.post('/wallet/webhook/PLISIO', payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      setSuccess(true);
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to simulate payment webhook.');
    } finally {
      setLoading(false);
    }
  };

  if (!reference) {
    return <p className="text-center text-sm text-emerald-100/50 mt-10">Invalid test invoice link: missing reference.</p>;
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <CheckCircle2 size={64} className="text-emerald-400 mb-6" />
        <h2 className="text-2xl font-black text-white mb-2">Payment Simulated!</h2>
        <p className="text-emerald-100/60 text-sm mb-8">
          The webhook has been fired. Your wallet should now be credited with the NGN equivalent.
        </p>
        <a 
          href="/wallet"
          className="rounded-full bg-[#D4AF37] px-6 py-3 font-bold text-[#062C23] hover:bg-[#F8D56B] transition-colors"
        >
          Return to Wallet
        </a>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 max-w-md mx-auto text-center">
      <div className="grid h-20 w-20 mx-auto place-items-center rounded-3xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
        <Bitcoin size={40} />
      </div>
      
      <div>
        <h1 className="text-2xl font-black text-white mb-2">Plisio Test Sandbox</h1>
        <p className="text-sm text-emerald-100/60 mb-1">
          Reference: <code className="text-xs text-white bg-black/40 px-2 py-1 rounded">{reference}</code>
        </p>
      </div>

      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-300 text-left flex items-start gap-3">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>This is a local sandbox for testing the crypto funding flow. Clicking the button below will fire a mock webhook to the backend, simulating a successful USDT payment.</p>
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">{error}</p>}

      <button
        onClick={simulatePayment}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Bitcoin size={18} />}
        {loading ? 'Processing webhook…' : 'Simulate Successful Payment'}
      </button>
    </div>
  );
}

export default function CryptoTestInvoicePage() {
  return (
    <main className="min-h-screen bg-[#062C23] text-white flex items-center justify-center">
      <Suspense fallback={<Loader2 className="animate-spin text-emerald-100/50" size={32} />}>
        <TestInvoiceContent />
      </Suspense>
    </main>
  );
}
