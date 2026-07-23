'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, ShieldCheck, Wallet, KeyRound, X } from 'lucide-react';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import PinInput from '@/components/ui/PinInput';
import Paystack from '@paystack/inline-js';

type PinStatus = { transactionPinEnabled: boolean; hasPinSet: boolean };

export default function PayPage() {
  const router = useRouter();
  const { cartItem, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'GATEWAY' | 'WALLET'>('GATEWAY');

  // PIN prompt state
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Prevents the !cartItem guard from redirecting to /catalog after a
  // successful purchase clears the cart.
  const purchasedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login?redirect=/pay'); return; }
    if (!cartItem && !purchasedRef.current) { router.replace('/catalog'); return; }

    // Load wallet balance and PIN status in parallel
    Promise.all([
      api.get('/wallet').catch(() => null),
      api.get<{ success: boolean; data: PinStatus }>('/profile/pin/status').catch(() => null),
    ]).then(([walletRes, pinRes]) => {
      if (walletRes?.data?.success) setWalletBalance(Number(walletRes.data.data.availableBalance));
      if (pinRes?.data?.success) setPinStatus(pinRes.data.data);
    });
  }, [cartItem, isAuthenticated, router]);

  if (!cartItem || !user || !isAuthenticated) return null;

  const itemPrice = Number(cartItem.price);
  const canUseWallet = walletBalance !== null && walletBalance >= itemPrice;

  const priceFormatted = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: cartItem.currency || 'NGN',
    minimumFractionDigits: 2,
  }).format(itemPrice);

  const balanceFormatted = walletBalance !== null
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(walletBalance)
    : '...';

  // Whether PIN is required for this wallet purchase
  const pinRequired = pinStatus?.transactionPinEnabled === true && pinStatus?.hasPinSet === true
  // Old account — no PIN set yet but also not enabled, so no block
  const pinNotSetUp = pinStatus?.hasPinSet === false

  function handlePayClick() {
    setError(null)
    if (paymentMethod === 'WALLET' && pinRequired) {
      setPin('')
      setPinError(null)
      setShowPinPrompt(true)
      return
    }
    void checkout()
  }

  async function checkout(walletPin?: string) {
    setLoading(true);
    setError(null);
    try {
      if (paymentMethod === 'WALLET') {
        if (!canUseWallet) throw new Error('Insufficient wallet balance.');

        const response = await api.post('/wallet/purchase', {
          productId:      cartItem!.id,
          customerEmail:  user!.email,
          idempotencyKey: crypto.randomUUID(),
          ...(walletPin ? { transactionPin: walletPin } : {}),
        });

        if (!response.data.success) throw new Error(response.data.message || 'Wallet purchase failed.');
        purchasedRef.current = true;
        clearCart();
        router.push(`/orders/${response.data.data.id}`);
        return;
      }

      // Gateway flow — unchanged
      const orderResponse = await api.post('/orders', {
        productId:     cartItem!.id,
        customerEmail: user!.email,
      });
      if (!orderResponse.data.success) throw new Error(orderResponse.data.message || 'Order could not be created.');

      const paymentResponse = await api.post('/payments/initialize', {
        orderId:     orderResponse.data.data.id,
        callbackUrl: `${window.location.origin}/verify`,
      });
      if (!paymentResponse.data.success || !paymentResponse.data.data?.authorizationUrl) {
        throw new Error(paymentResponse.data.message || 'Payment could not be initialized.');
      }

      const { authorizationUrl, reference, accessCode } = paymentResponse.data.data;
      purchasedRef.current = true;
      clearCart();

      if (cartItem!.paymentGateway === 'PAYSTACK') {
        if (!accessCode) throw new Error('Paystack access code was not returned from the server.');
        const popup = new Paystack();
        popup.resumeTransaction(accessCode, {
          onSuccess: () => { router.push(`/verify?reference=${encodeURIComponent(reference)}`); },
          onCancel:  () => { setLoading(false); },
          onError:   (err: unknown) => {
            console.error('Paystack Inline Error:', err);
            setError('Payment checkout failed. Please try again.');
            setLoading(false);
          },
        });
      } else {
        window.location.assign(authorizationUrl);
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Unable to complete checkout.'));
      setLoading(false);
    }
  }

  async function submitPin() {
    if (pin.length !== 6) {
      setPinError('Enter your 6-digit transaction PIN');
      return;
    }
    setShowPinPrompt(false);
    let checkoutError: string | null = null;
    setError(null);
    try {
      await checkout(pin);
    } catch {
      // checkout() handles its own errors internally, this is a safety net
    }
    // Re-show the PIN prompt if an error was set during checkout (wrong PIN etc.)
    // We read from the React setter pattern by checking via a flag set in checkout.
    // Since checkout() sets error state, we re-open the prompt after the tick.
    setTimeout(() => {
      setError((current) => {
        if (current) setShowPinPrompt(true);
        return current;
      });
    }, 0);
    setPin('');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#062C23] px-5 py-12 text-white">
      <section className="w-full max-w-xl rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-7 shadow-premium-dark backdrop-blur-xl sm:p-9">
        <Link href="/catalog" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/65 hover:text-[#F8D56B]">
          <ArrowLeft size={16}/> Continue browsing
        </Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Secure checkout</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Confirm your order.</h1>
        <p className="mt-2 text-sm text-emerald-100/65">Cogna creates your order first, then redirects you to your selected payment method.</p>

        {error && (
          <p role="alert" className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-950/30 p-4 text-sm text-rose-100">
            {error}
          </p>
        )}

        <div className="mt-7 rounded-3xl border border-emerald-100/15 bg-black/15 p-5">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#F8D56B]">{cartItem.category.name}</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{cartItem.name}</h2>
              <p className="mt-2 text-sm text-emerald-100/60">{cartItem.description || 'Product details are confirmed by Cogna before fulfillment.'}</p>
            </div>
            <p className="whitespace-nowrap text-xl font-bold">{priceFormatted}</p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${paymentMethod === 'WALLET' ? 'border-[#F8D56B] bg-[#F8D56B]/10' : 'border-emerald-100/15 bg-black/15'} ${!canUseWallet ? 'cursor-not-allowed opacity-30' : 'hover:bg-white/5'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="paymentMethod" value="WALLET" disabled={!canUseWallet} checked={paymentMethod === 'WALLET'} onChange={() => setPaymentMethod('WALLET')} className="h-4 w-4 accent-[#F8D56B]" />
              <div>
                <p className="font-bold text-white flex items-center gap-2"><Wallet size={16}/> Pay with Wallet</p>
                <p className="text-xs text-emerald-100/60 mt-0.5">Available balance: {balanceFormatted}</p>
          {paymentMethod === 'WALLET' && pinRequired && (
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#F8D56B]/80">
              <KeyRound size={10}/> PIN required at checkout
            </p>
          )}
          {paymentMethod === 'WALLET' && pinNotSetUp && (
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-amber-400/80">
              <KeyRound size={10}/> No PIN set — <a href="/security" className="underline hover:text-amber-300">set one in Security</a>
            </p>
          )}
              </div>
            </div>
            {!canUseWallet && walletBalance !== null && (
              <span className="text-[10px] uppercase tracking-wider text-rose-300 font-bold bg-rose-950/50 px-2 py-1 rounded-full">Insufficient</span>
            )}
          </label>

          <label className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-colors ${paymentMethod === 'GATEWAY' ? 'border-[#F8D56B] bg-[#F8D56B]/10' : 'border-emerald-100/15 bg-black/15 hover:bg-white/5'}`}>
            <div className="flex items-center gap-3">
              <input type="radio" name="paymentMethod" value="GATEWAY" checked={paymentMethod === 'GATEWAY'} onChange={() => setPaymentMethod('GATEWAY')} className="h-4 w-4 accent-[#F8D56B]" />
              <div>
                <p className="font-bold text-white flex items-center gap-2"><CreditCard size={16}/> Pay with Gateway</p>
                <p className="text-xs text-emerald-100/60 mt-0.5">Via {cartItem.paymentGateway}</p>
              </div>
            </div>
          </label>
        </div>

        {/* PIN Prompt (inline, shown when wallet + PIN required) */}
        {showPinPrompt && (
          <div className="mt-6 rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-[#D4AF37]/15 p-2 text-[#F8D56B]"><KeyRound size={16}/></span>
                <div>
                  <p className="text-sm font-bold">Enter Transaction PIN</p>
                  <p className="text-[11px] text-emerald-100/55">Confirm your 6-digit PIN to authorise this purchase</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowPinPrompt(false); setLoading(false); }}
                className="rounded-lg p-1.5 text-emerald-100/40 hover:text-emerald-100 transition-colors"
                aria-label="Cancel PIN entry"
              >
                <X size={16}/>
              </button>
            </div>

            {pinError && (
              <p role="alert" className="mb-4 rounded-xl border border-rose-300/25 bg-rose-950/30 px-3 py-2 text-xs text-rose-100">
                {pinError}
              </p>
            )}

            <PinInput id="checkout-pin" value={pin} onChange={setPin} disabled={loading} />

            <button
              type="button"
              disabled={loading || pin.length !== 6}
              onClick={() => void submitPin()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="animate-spin" size={18}/> : <><ShieldCheck size={18}/> Confirm &amp; Pay {priceFormatted}</>}
            </button>
          </div>
        )}

        {!showPinPrompt && (
          <button
            type="button"
            disabled={loading || (paymentMethod === 'WALLET' && !canUseWallet)}
            onClick={handlePayClick}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-4 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : paymentMethod === 'WALLET' ? <Wallet size={18}/> : <CreditCard size={18}/>}
            {loading ? 'Processing checkout…' : `Pay ${priceFormatted}`}
          </button>
        )}

        <p className="mt-5 flex gap-2 text-xs leading-5 text-emerald-100/60">
          <ShieldCheck className="shrink-0 text-[#F8D56B]" size={16}/>
          Your service starts only after payment confirmation and provider fulfillment.
        </p>
      </section>
    </main>
  );
}