'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, KeyRound, Loader2 } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/profile/verify-email', { token });
      if (!response.data.success) throw new Error(response.data.message || 'Unable to verify email.');
      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : requestError instanceof Error ? requestError.message : null;
      setError(message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative w-full max-w-md rounded-[2rem] border border-emerald-100/15 bg-white/[0.07] p-7 shadow-premium-dark backdrop-blur-xl sm:p-9">
      <Link href="/" className="mb-2 block">
        <Image src="/logo-cogna.png" alt="Cogna" width={110} height={30} className="h-6 w-auto" priority />
      </Link>
      <h1 className="mt-5 font-display text-3xl font-bold">Verify your email.</h1>
      
      {!success ? (
        <>
          <p className="mt-2 text-sm leading-6 text-emerald-100/65">
            We sent a 6-digit verification code to <strong className="text-white">{email}</strong>.
          </p>
          {error && <p role="alert" className="mt-6 rounded-2xl border border-rose-200/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</p>}
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-xs font-bold text-emerald-100/75">Verification Code
              <span className="relative mt-2 block">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40"><KeyRound size={16} /></span>
                <input required type="text" maxLength={6} value={token} onChange={(event) => setToken(event.target.value)} className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/70 py-3 pl-11 pr-4 text-sm tracking-widest outline-none focus:border-[#D4AF37]" placeholder="123456" />
              </span>
            </label>
            <button disabled={loading || token.length < 6} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-bold text-[#062C23] transition hover:bg-[#F8D56B] disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={17} /> : <>Verify Email <ArrowRight size={17} /></>}
            </button>
          </form>
        </>
      ) : (
        <div className="mt-8 flex flex-col items-center justify-center space-y-4 py-4 text-center">
          <CheckCircle2 className="text-[#F8D56B]" size={48} />
          <p className="text-lg font-bold text-white">Email verified!</p>
          <p className="text-sm text-emerald-100/65">Redirecting you to login...</p>
        </div>
      )}
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062C23] px-5 py-12 text-white">
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <Suspense fallback={<div className="flex w-full max-w-md items-center justify-center py-20"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>}>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
