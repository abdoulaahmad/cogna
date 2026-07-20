'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : requestError instanceof Error ? requestError.message : null;
      setError(message || 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062C23] px-5 py-12 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-emerald-100/15 bg-white/[0.07] p-7 shadow-premium-dark backdrop-blur-xl sm:p-9">
        <Link href="/" className="mb-2 block">
          <Image src="/logo-cogna.png" alt="Cogna" width={110} height={30} className="h-6 w-auto" priority />
        </Link>
        <h1 className="mt-5 font-display text-3xl font-bold">Reset Password</h1>
        
        {success ? (
          <div className="mt-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Mail size={24} />
            </div>
            <p className="text-sm leading-6 text-emerald-100/80">
              If an account exists for <strong className="text-white">{email}</strong>, you will receive a password reset code shortly.
            </p>
            <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="mt-6 inline-block rounded-full bg-emerald-500/20 px-6 py-2 text-sm font-bold text-emerald-400 hover:bg-emerald-500/30">
              Enter Reset Code
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-emerald-100/65">
              Enter your email address and we'll send you a code to reset your password.
            </p>
            {error && <p role="alert" className="mt-6 rounded-2xl border border-rose-200/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</p>}
            <form onSubmit={submit} className="mt-7 space-y-4">
              <label className="block text-xs font-bold text-emerald-100/75">Email address
                <span className="relative mt-2 block">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={16} />
                  <input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/70 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37]" placeholder="you@example.com" />
                </span>
              </label>
              
              <button disabled={loading || !email} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-bold text-[#062C23] transition hover:bg-[#F8D56B] disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={17} /> : <>Send Reset Code <ArrowRight size={17} /></>}
              </button>
            </form>
          </>
        )}
        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-bold text-[#F8D56B] hover:text-white">Back to login</Link>
        </div>
      </section>
    </main>
  );
}
