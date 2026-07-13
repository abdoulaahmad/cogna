'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    // Basic client validation
    if (!email || !password) {
      setFormError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        // Save auth state (Zustand persists it to localStorage)
        setAuth(response.data.data);
        
        // Redirect based on user role
        const userRole = response.data.data.user.role;
        if (userRole === 'ADMIN') {
          router.push('/admin/products');
        } else if (userRole === 'DEVELOPER') {
          router.push('/keys');
        } else {
          router.push('/orders');
        }
      } else {
        setFormError(response.data.message || 'Login failed');
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
        setFormError(resData?.message || 'Invalid credentials or server error.');
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
            Welcome Back
          </h2>

          {formError ? (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-500 border border-rose-100">
              {formError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 font-semibold">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-indigo-600 hover:text-indigo-700 font-bold transition"
            >
              Create one for free
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
