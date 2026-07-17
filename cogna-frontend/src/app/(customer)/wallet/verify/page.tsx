'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock3, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';

function VerifyFunding() {
  const searchParams = useSearchParams(); const reference = searchParams.get('reference') || searchParams.get('paymentReference'); const requested = useRef(false); const [state, setState] = useState<'VERIFYING' | 'COMPLETED' | 'PENDING' | 'FAILED'>('VERIFYING'); const [message, setMessage] = useState('Confirming your payment with the gateway.');
  useEffect(() => { if (!reference || requested.current) return; requested.current = true; const timer = window.setTimeout(() => { void api.get(`/wallet/fundings/${encodeURIComponent(reference)}/verify`).then((response) => { const status = response.data.data?.status; if (status === 'COMPLETED') { setState('COMPLETED'); setMessage('Your payment was verified and your wallet has been credited.'); } else if (status === 'PENDING' || status === 'INITIATED') { setState('PENDING'); setMessage('The gateway has not confirmed this payment yet. Your balance will update only after confirmation.'); } else { setState('FAILED'); setMessage('This funding attempt was not completed.'); } }).catch((requestError: unknown) => { setState('FAILED'); setMessage(getErrorMessage(requestError, 'Wallet funding could not be verified.')); }); }, 0); return () => window.clearTimeout(timer); }, [reference]);
  const effectiveState = reference ? state : 'FAILED';
  const effectiveMessage = reference ? message : 'No wallet funding reference was returned by the gateway.';
  const icon = effectiveState === 'COMPLETED' ? <CheckCircle2 className="text-emerald-300" size={56}/> : effectiveState === 'FAILED' ? <XCircle className="text-rose-300" size={56}/> : effectiveState === 'PENDING' ? <Clock3 className="text-amber-200" size={56}/> : <Loader2 className="animate-spin text-[#F8D56B]" size={50}/>;
  const title = effectiveState === 'COMPLETED' ? 'Funding confirmed.' : effectiveState === 'FAILED' ? 'Funding not confirmed.' : effectiveState === 'PENDING' ? 'Funding still pending.' : 'Verifying your funding.';
  return <main className="flex min-h-screen items-center justify-center bg-[#062C23] px-5 py-16 text-white"><section className="w-full max-w-xl rounded-[2rem] border border-emerald-100/15 bg-white/[0.08] p-8 text-center shadow-premium-dark backdrop-blur-xl"><div className="flex justify-center">{icon}</div><p className="mt-6 text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Wallet funding</p><h1 className="mt-3 font-display text-3xl font-bold">{title}</h1><p className="mt-4 text-sm leading-7 text-emerald-100/70">{effectiveMessage}</p>{reference && <p className="mt-5 break-all text-xs text-emerald-100/45">Reference: {reference}</p>}<Link href="/wallet" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B]">Return to wallet</Link><p className="mt-6 flex justify-center gap-2 text-xs text-emerald-100/55"><ShieldCheck size={15} className="text-[#F8D56B]"/>Your wallet is updated only by verified backend ledger activity.</p></section></main>;
}
export default function WalletVerifyPage() { return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#062C23]"><Loader2 className="animate-spin text-[#F8D56B]"/></main>}><VerifyFunding/></Suspense>; }