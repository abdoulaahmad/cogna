'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import axios from 'axios';
import { api } from '@/lib/api';
import PinInput from '@/components/ui/PinInput';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (transactionPin.length !== 6) {
      setError('Transaction PIN must be exactly 6 digits');
      return;
    }
    if (transactionPin !== confirmPin) {
      setError('Transaction PINs do not match');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        transactionPin,
      });
      if (!response.data.success) throw new Error(response.data.message || 'Unable to create account.');
      router.replace(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (requestError: unknown) {
      if (axios.isAxiosError(requestError)) {
        const data = requestError.response?.data;
        const message = data?.errors?.[0]?.message || data?.message || requestError.message || null;
        setError(message || 'Unable to create your account.');
      } else {
        setError('Unable to create your account.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#062C23] px-5 py-12 text-white">
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[2rem] border border-emerald-100/15 bg-white/[0.07] p-7 shadow-premium-dark backdrop-blur-xl sm:p-9">
        <Link href="/" className="mb-2 block">
          <Image src="/logo-cogna.png" alt="Cogna" width={110} height={30} className="h-6 w-auto" priority />
        </Link>
        <h1 className="mt-5 font-display text-3xl font-bold">Create your account.</h1>
        <p className="mt-2 text-sm leading-6 text-emerald-100/65">One account gives you customer tools first, with developer access available when you need it.</p>
        {error && <p role="alert" className="mt-6 rounded-2xl border border-rose-200/25 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">{error}</p>}
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field label="Full name" icon={<UserRound size={16} />} value={fullName} onChange={setFullName} autoComplete="name" />
          <Field label="Email address" icon={<Mail size={16} />} value={email} onChange={setEmail} type="email" autoComplete="email" />
          <Field label="Password" icon={<LockKeyhole size={16} />} value={password} onChange={setPassword} type="password" autoComplete="new-password" hint="At least 8 characters, including an uppercase letter and number." />
          <Field label="Confirm Password" icon={<LockKeyhole size={16} />} value={confirmPassword} onChange={setConfirmPassword} type="password" autoComplete="new-password" />

          {/* Transaction PIN */}
          <div className="pt-2">
            <div className="mb-4 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
              <p className="text-xs font-bold text-[#F8D56B]">Transaction PIN</p>
              <p className="mt-1 text-[11px] leading-5 text-emerald-100/55">
                Set a 6-digit PIN to protect your wallet purchases. You can change or disable it anytime from Security settings.
              </p>
            </div>
            <div className="space-y-4">
              <PinInput
                id="transaction-pin"
                label="Set Transaction PIN"
                value={transactionPin}
                onChange={setTransactionPin}
                hint="6 digits only"
              />
              <PinInput
                id="confirm-pin"
                label="Confirm Transaction PIN"
                value={confirmPin}
                onChange={setConfirmPin}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-bold text-[#062C23] transition hover:bg-[#F8D56B] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={17} /> : <>Create account <ArrowRight size={17} /></>}
          </button>
        </form>
        <p className="mt-7 text-center text-sm text-emerald-100/60">Already registered? <Link href="/login" className="font-bold text-[#F8D56B] hover:text-white">Sign in</Link></p>
      </section>
    </main>
  );
}

function Field({ label, icon, value, onChange, type = 'text', autoComplete, hint }: { label: string; icon: React.ReactNode; value: string; onChange: (value: string) => void; type?: string; autoComplete: string; hint?: string }) {
  return (
    <label className="block text-xs font-bold text-emerald-100/75">{label}
      <span className="relative mt-2 block">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/40">{icon}</span>
        <input required type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-emerald-100/15 bg-[#062C23]/70 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#D4AF37]" />
      </span>
      {hint && <span className="mt-2 block text-[11px] font-medium leading-5 text-emerald-100/45">{hint}</span>}
    </label>
  );
}