'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, LockKeyhole, Mail } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, updateUser } = useAuthStore();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const response = await api.post('/auth/login', { email: email.trim(), password });
      if (!response.data.success) throw new Error(response.data.message || 'Unable to sign in.');
      setAuth(response.data.data);
      const profileResponse = await api.get('/auth/me');
      const profile = profileResponse.data.data;
      updateUser(profile);
      if (profile.status === 'SUSPENDED') { setError('This account is suspended. Contact support for assistance.'); return; }
      const redirect = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('redirect');
      if (redirect?.startsWith('/') && !redirect.startsWith('//')) router.replace(redirect);
      else router.replace(profile.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard');
    } catch (requestError: unknown) {
      const message = axios.isAxiosError(requestError) ? requestError.response?.data?.message : requestError instanceof Error ? requestError.message : null;
      setError(message || 'Unable to sign in with those credentials.');
    } finally { setLoading(false); }
  }
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062C23] px-5 py-12 text-white"><div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl"/><section className="relative w-full max-w-md rounded-[2rem] border border-emerald-100/15 bg-white/[0.07] p-7 shadow-premium-dark backdrop-blur-xl sm:p-9"><Link href="/" className="mb-2 block"><Image src="/logo-cogna.png" alt="Cogna" width={110} height={30} className="h-6 w-auto" priority/></Link><h1 className="mt-5 font-display text-3xl font-bold">Welcome back.</h1><p className="mt-2 text-sm leading-6 text-emerald-100/65">Sign in to your wallet, orders, developer tools, and account settings.</p>{error && <p role="alert" className="mt-6 rounded-2xl border border-rose-200/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</p>}<form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-xs font-bold text-emerald-100/75">Email address<span className="relative mt-2 block"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={16}/><input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/70 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37]" placeholder="you@example.com"/></span></label><label className="block text-xs font-bold text-emerald-100/75">Password<span className="relative mt-2 block"><LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40" size={16}/><input required autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/70 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37]" placeholder="Your password"/></span></label><div className="flex justify-end"><Link href="/forgot-password" className="text-xs font-bold text-[#F8D56B] hover:text-white">Forgot password?</Link></div><button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-bold text-[#062C23] transition hover:bg-[#F8D56B] disabled:opacity-50">{loading ? <Loader2 className="animate-spin" size={17}/> : <>Sign in <ArrowRight size={17}/></>}</button></form><p className="mt-7 text-center text-sm text-emerald-100/60">New to Cogna? <Link href="/register" className="font-bold text-[#F8D56B] hover:text-white">Create an account</Link></p></section></main>;
}