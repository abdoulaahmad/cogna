'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
import Paystack from '@paystack/inline-js';

type Gateway = 'PAYSTACK' | 'MONNIFY';
export default function FundWalletPage() {
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState<Gateway>('PAYSTACK');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      setError('Enter a funding amount of at least ₦100.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/wallet/fund', {
        amount: parsedAmount,
        currency: 'NGN',
        gateway,
        idempotencyKey: crypto.randomUUID(),
        callbackUrl: `${window.location.origin}/wallet/verify`,
      });

      if (!response.data.success || !response.data.data?.authorizationUrl) {
        throw new Error(response.data.message || 'Funding could not be initialized.');
      }

      const { authorizationUrl, reference, accessCode } = response.data.data;

      if (gateway === 'PAYSTACK') {
        if (!accessCode) {
          throw new Error('Paystack access code was not returned from the server.');
        }
        const popup = new Paystack();
        popup.resumeTransaction(accessCode, {
          onSuccess: () => {
            window.location.assign(`${window.location.origin}/wallet/verify?reference=${encodeURIComponent(reference)}`);
          },
          onCancel: () => {
            setLoading(false);
          },
          onError: (err: unknown) => {
            console.error('Paystack Inline Error:', err);
            setError('Payment checkout failed. Please try again.');
            setLoading(false);
          },
        });
      } else {
        window.location.assign(authorizationUrl);
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Unable to initialize wallet funding.'));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#062C23] text-white">
      <CustomerPortalNav current="/wallet"/>
      <div className="mx-auto max-w-xl px-5 py-10">
        <Link href="/wallet" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/65 hover:text-[#F8D56B]">
          <ArrowLeft size={16}/> Wallet
        </Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Secure funding</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Add funds to your wallet.</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-100/65">Choose a verified gateway. Cogna credits your balance only after the gateway result is confirmed.</p>
        <form onSubmit={submit} className="mt-8 rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-7 shadow-premium-dark backdrop-blur-xl">
          <label className="text-sm font-bold">
            Amount (NGN)
            <input required min="100" inputMode="decimal" type="number" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-3 w-full rounded-2xl border border-emerald-100/20 bg-black/20 px-4 py-4 text-xl outline-none focus:border-[#D4AF37]" placeholder="5000"/>
          </label>
          <fieldset className="mt-7">
            <legend className="text-sm font-bold">Choose gateway</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(['PAYSTACK', 'MONNIFY'] as const).map((item) => (
                <button type="button" onClick={() => setGateway(item)} className={gateway === item ? 'rounded-2xl border border-[#D4AF37] bg-[#D4AF37]/15 p-4 text-sm font-bold text-[#F8D56B]' : 'rounded-2xl border border-emerald-100/15 bg-black/10 p-4 text-sm font-bold text-emerald-100/70'} key={item}>
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}
          <button disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <CreditCard size={18}/>}
            {loading ? 'Preparing secure checkout…' : `Continue with ${gateway}`}
          </button>
          <p className="mt-5 flex gap-2 text-xs leading-5 text-emerald-100/60">
            <ShieldCheck size={15} className="shrink-0 text-[#F8D56B]"/>
            A redirect does not credit your wallet. Gateway confirmation is verified by Cogna first.
          </p>
        </form>
      </div>
    </main>
  );
}