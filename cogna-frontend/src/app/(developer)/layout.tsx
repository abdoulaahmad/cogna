'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    async function verifyCapability() {
      if (!isAuthenticated) { router.replace('/login'); return; }
      try {
        const response = await api.get('/auth/me');
        if (active && response.data.success) updateUser(response.data.data);
      } catch {
        if (active) router.replace('/dashboard');
      } finally {
        if (active) setChecking(false);
      }
    }
    void verifyCapability();
    return () => { active = false; };
  }, [isAuthenticated, router, updateUser]);

  if (checking || !isAuthenticated || (!user?.isDeveloper && user?.role !== 'DEVELOPER' && user?.role !== 'ADMIN')) {
    return <main className="min-h-screen bg-[#062C23] text-white" aria-busy="true" />;
  }

  return children;
}