'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    if (!fullName || !email || !password) {
      setFormError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        fullName,
        email,
        password,
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setFormError(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      const resData = error.response?.data;
      if (resData?.errors) {
        const mappedErrors: Record<string, string> = {};
        resData.errors.forEach((err: { field: string; message: string }) => {
          mappedErrors[err.field] = err.message;
        });
        setFieldErrors(mappedErrors);
        setFormError('Please check your inputs.');
      } else {
        setFormError(resData?.message || 'Email already exists or server error.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    alert(`Initiating sign-up with ${provider}...`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#081A16] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden font-display">
      
      {/* Background Radial Glow Effects */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-[#18B88A]/5 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] left-[10%] w-[350px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-[90px] pointer-events-none z-0" />

      <div className="w-full max-w-[450px] relative z-10 space-y-8">
        
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center justify-center">
          <Link href="/" className="focus:outline-none mb-3 block">
            <img
              src="/logo-cogna.png"
              alt="Cogna Logo"
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          <p className="mt-1 text-[10px] font-bold text-[#C6D6D1] uppercase tracking-widest">
            API-First AI Subscription Marketplace
          </p>
        </div>

        {/* Auth Glass Card Panel */}
        <div className="p-8 bg-[rgba(18,46,39,0.8)] border border-white/5 shadow-[0_0_50px_rgba(24,184,138,0.15)] rounded-[24px] backdrop-blur-[24px]">
          
          {/* Cogna Infinity Logo */}
          <div className="flex justify-center mb-5">
            <div className="p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
              <svg className="w-9 h-9 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z" />
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Create Your Account
            </h2>
            <p className="mt-2 text-xs text-[#C6D6D1] font-semibold leading-relaxed max-w-[280px] mx-auto">
              Sign up to start subscribing to the best proxy AI gateway models.
            </p>
          </div>

          {isSuccess ? (
            <div className="mb-5 rounded-xl bg-emerald-950/20 p-3.5 text-xs font-semibold text-[#18B88A] border border-[#18B88A]/30">
              Registration successful! Redirecting to login...
            </div>
          ) : null}

          {formError ? (
            <div className="mb-5 rounded-xl bg-rose-950/20 p-3.5 text-xs font-semibold text-rose-200 border border-rose-500/30">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#C6D6D1] select-none">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full bg-[#0C241E]/40 border ${
                    fieldErrors.fullName ? 'border-rose-500/50' : 'border-slate-700/50'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all duration-200`}
                  required
                />
              </div>
              {fieldErrors.fullName && (
                <span className="text-xs font-medium text-rose-500 mt-0.5">
                  {fieldErrors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#C6D6D1] select-none">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-[#0C241E]/40 border ${
                    fieldErrors.email ? 'border-rose-500/50' : 'border-slate-700/50'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all duration-200`}
                  required
                />
              </div>
              {fieldErrors.email && (
                <span className="text-xs font-medium text-rose-500 mt-0.5">
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#C6D6D1] select-none">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-[#0C241E]/40 border ${
                    fieldErrors.password ? 'border-rose-500/50' : 'border-slate-700/50'
                  } rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/40 transition-all duration-200`}
                  required
                />
              </div>
              {fieldErrors.password && (
                <span className="text-xs font-medium text-rose-500 mt-0.5">
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#F8D56B] via-[#D4AF37] to-[#B8860B] hover:from-[#E6C25E] hover:to-[#A67507] text-slate-950 font-bold text-sm transition-all duration-300 shadow-[0_4px_25px_rgba(212,175,55,0.2)] hover:shadow-[0_8px_30px_rgba(212,175,55,0.4)] hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Sign Up <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
              <span className="bg-[#0C241E]/90 px-3.5 text-[#C6D6D1] rounded-full py-0.5 border border-white/5">
                Or sign up with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleOAuthLogin('Google')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-[#0C241E]/30 text-xs font-bold text-slate-300 hover:text-white hover:border-[#D4AF37]/40 hover:bg-[#18B88A]/5 transition-all duration-200"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuthLogin('GitHub')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-[#0C241E]/30 text-xs font-bold text-slate-300 hover:text-white hover:border-[#D4AF37]/40 hover:bg-[#18B88A]/5 transition-all duration-200"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </button>
          </div>

          {/* Toggle link */}
          <div className="mt-6 text-center text-xs text-slate-400 font-semibold">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#D4AF37] hover:text-[#B8860B] font-bold transition-all duration-200"
            >
              Sign In instead
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
