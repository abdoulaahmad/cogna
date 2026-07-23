'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bitcoin, CreditCard, Info, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
import Paystack from '@paystack/inline-js';

type Gateway = 'PAYSTACK' | 'MONNIFY' | 'CRYPTO';

interface CryptoRate { rateNgn: number | null; walletAddress: string | null }

export default function FundWalletPage() {
  const router = useRouter();
  const [gateway, setGateway] = useState<Gateway>('PAYSTACK');

  // Fiat fields
  const [amount, setAmount] = useState('');

  // Crypto fields
  const [usdtAmount, setUsdtAmount] = useState('');
  const [cryptoRate, setCryptoRate] = useState<CryptoRate | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cryptoPending, setCryptoPending] = useState<{ reference: string; ngnEquivalent: number; usdtAmount: number; authorizationUrl: string } | null>(null);

  const loadCryptoRate = useCallback(async () => {
    setRateLoading(true);
    try {
      const res = await api.get('/wallet/crypto-rate');
      setCryptoRate(res.data.data as CryptoRate);
    } catch {
      // silently fail — rate will just show N/A
    } finally {
      setRateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (gateway === 'CRYPTO') void loadCryptoRate();
  }, [gateway, loadCryptoRate]);

  const ngnEquivalent = cryptoRate?.rateNgn && usdtAmount && Number(usdtAmount) > 0
    ? Number(usdtAmount) * cryptoRate.rateNgn
    : null;

  async function submitFiat(event: FormEvent<HTMLFormElement>) {
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
        if (!accessCode) throw new Error('Paystack access code was not returned from the server.');
        const popup = new Paystack();
        popup.resumeTransaction(accessCode, {
          onSuccess: () => {
            router.push(`/wallet/verify?reference=${encodeURIComponent(reference)}`);
          },
          onCancel: () => setLoading(false),
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

  async function submitCrypto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const usdt = Number(usdtAmount);
    if (!Number.isFinite(usdt) || usdt < 1) {
      setError('Minimum deposit is 1 USDT.');
      return;
    }
    if (!cryptoRate?.rateNgn) {
      setError('Crypto rate not loaded. Please refresh and try again.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/wallet/fund/crypto', {
        usdtAmount: usdt,
        idempotencyKey: crypto.randomUUID(),
        callbackUrl: `${window.location.origin}/wallet/crypto-pending`,
      });

      if (!res.data.success) throw new Error(res.data.message || 'Crypto funding could not be initialized.');

      const data = res.data.data as { reference: string; ngnEquivalent: number; usdtAmount: number; authorizationUrl: string };
      setCryptoPending(data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Unable to initialize crypto funding.'));
    } finally {
      setLoading(false);
    }
  }

  // ── Crypto Pending View (after Plisio invoice created) ────────────────────
  if (cryptoPending) {
    return (
      <main className="min-h-screen bg-[#062C23] text-white">
        <CustomerPortalNav current="/wallet" />
        <div className="mx-auto max-w-xl px-5 py-10">
          <div className="rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-7 shadow-premium-dark backdrop-blur-xl space-y-6">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
                <Bitcoin size={28} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-400">Payment initiated</p>
                <h1 className="mt-1 text-2xl font-black">Send your USDT now</h1>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100/10 bg-black/20 p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-100/55">You send</span>
                <span className="font-black text-white text-lg">{cryptoPending.usdtAmount} USDT (BEP20)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-100/55">You receive</span>
                <span className="font-black text-[#F8D56B] text-lg">
                  {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(cryptoPending.ngnEquivalent)}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-100/10">
                <p className="text-xs text-emerald-100/40 mb-1">Reference</p>
                <code className="text-xs text-white break-all">{cryptoPending.reference}</code>
              </div>
            </div>

            <a
              href={cryptoPending.authorizationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-full bg-[#D4AF37] px-5 py-4 text-center font-bold text-[#062C23] hover:bg-[#F8D56B] transition-colors"
            >
              Open Plisio payment page →
            </a>

            <div className="flex items-start gap-2 text-xs text-emerald-100/50">
              <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#F8D56B]" />
              <span>
                After sending USDT, your NGN wallet balance will be credited automatically once Plisio confirms receipt. This typically takes 1–5 minutes.
                Do not close this page until you have opened the Plisio payment link.
              </span>
            </div>

            <button
              onClick={() => { setCryptoPending(null); setUsdtAmount(''); }}
              className="w-full text-center text-xs text-emerald-100/40 hover:text-white pt-2"
            >
              ← Start a new funding
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Main Funding Form ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#062C23] text-white">
      <CustomerPortalNav current="/wallet" />
      <div className="mx-auto max-w-xl px-5 py-10">
        <Link href="/wallet" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/65 hover:text-[#F8D56B]">
          <ArrowLeft size={16} /> Wallet
        </Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Secure funding</p>
        <h1 className="mt-3 font-display text-4xl font-bold">Add funds to your wallet.</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-100/65">
          Choose a verified gateway. Cogna credits your balance only after the gateway result is confirmed.
        </p>

        {/* Gateway Selector */}
        <div className="mt-8 mb-6">
          <p className="text-sm font-bold mb-3">Choose payment method</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { key: 'PAYSTACK', label: 'Paystack', sub: 'Card / Bank', icon: <CreditCard size={18} /> },
              { key: 'MONNIFY', label: 'Monnify', sub: 'Bank transfer', icon: <CreditCard size={18} /> },
              { key: 'CRYPTO', label: 'Crypto', sub: 'USDT BEP20', icon: <Bitcoin size={18} /> },
            ] as const).map(({ key, label, sub, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setGateway(key); setError(null); }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all ${
                  gateway === key
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F8D56B]'
                    : 'border-emerald-100/15 bg-black/10 text-emerald-100/70 hover:border-emerald-100/30'
                }`}
              >
                {icon}
                <span className="text-xs font-bold">{label}</span>
                <span className="text-[10px] opacity-60">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {gateway !== 'CRYPTO' ? (
          // ── Fiat Funding Form ───────────────────────────────────────────
          <form onSubmit={submitFiat} className="rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-7 shadow-premium-dark backdrop-blur-xl">
            <label className="text-sm font-bold">
              Amount (NGN)
              <input
                required
                min="100"
                inputMode="decimal"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-3 w-full rounded-2xl border border-emerald-100/20 bg-black/20 px-4 py-4 text-xl outline-none focus:border-[#D4AF37]"
                placeholder="5000"
              />
            </label>
            {error && <p role="alert" className="mt-5 text-sm text-rose-200">{error}</p>}
            <button
              disabled={loading}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
              {loading ? 'Preparing secure checkout…' : `Continue with ${gateway}`}
            </button>
            <p className="mt-5 flex gap-2 text-xs leading-5 text-emerald-100/60">
              <ShieldCheck size={15} className="shrink-0 text-[#F8D56B]" />
              A redirect does not credit your wallet. Gateway confirmation is verified by Cogna first.
            </p>
          </form>
        ) : (
          // ── Crypto Funding Form ─────────────────────────────────────────
          <form onSubmit={submitCrypto} className="rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-7 shadow-premium-dark backdrop-blur-xl space-y-6">
            {rateLoading ? (
              <div className="flex items-center gap-3 text-emerald-100/50 text-sm">
                <RefreshCw size={16} className="animate-spin" /> Loading current rate…
              </div>
            ) : cryptoRate?.rateNgn ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs text-amber-300">
                <Info size={14} className="shrink-0" />
                Current rate: <span className="font-black ml-1">1 USDT = {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(cryptoRate.rateNgn)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-xs text-rose-300">
                <Info size={14} className="shrink-0" />
                Crypto funding is not currently available. Please try again later or use Paystack.
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">USDT Amount (minimum 1 USDT)</label>
              <input
                required
                type="number"
                inputMode="decimal"
                min="1"
                step="0.01"
                value={usdtAmount}
                onChange={(e) => setUsdtAmount(e.target.value)}
                className="w-full rounded-2xl border border-emerald-100/20 bg-black/20 px-4 py-4 text-xl outline-none focus:border-[#D4AF37]"
                placeholder="10"
              />
              {ngnEquivalent !== null && (
                <p className="mt-3 text-sm text-emerald-100/70">
                  You will receive:{' '}
                  <span className="font-black text-[#F8D56B] text-base">
                    {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(ngnEquivalent)}
                  </span>
                </p>
              )}
            </div>

            {error && <p role="alert" className="text-sm text-rose-200">{error}</p>}

            <button
              disabled={loading || !cryptoRate?.rateNgn}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Bitcoin size={18} />}
              {loading ? 'Creating invoice…' : 'Proceed with USDT'}
            </button>

            <p className="flex items-start gap-2 text-xs leading-5 text-emerald-100/55">
              <ShieldCheck size={15} className="shrink-0 mt-0.5 text-[#F8D56B]" />
              Network: BEP20 (Binance Smart Chain) only. Sending on the wrong network will result in permanent loss of funds.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}