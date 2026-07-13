'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

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

    // Basic client validation
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
        // Zod validation errors
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="text-3xl font-display font-bold tracking-tight text-indigo-600">
            COGNA
          </Link>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            API-First AI Subscription Marketplace
          </p>
        </div>

        <GlassCard className="p-8">
          <h2 className="mb-6 text-center text-xl font-display font-bold text-slate-800">
            Create Your Account
          </h2>

          {isSuccess ? (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 border border-emerald-100">
              Registration successful! Redirecting to login...
            </div>
          ) : null}

          {formError ? (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-500 border border-rose-100">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.fullName}
              autoComplete="name"
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              autoComplete="new-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              disabled={isSuccess}
            >
              Sign Up
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-semibold">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-600 hover:text-indigo-700 font-bold transition"
            >
              Sign In instead
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
