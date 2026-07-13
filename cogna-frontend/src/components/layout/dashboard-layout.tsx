'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { ShoppingBag, Key, BarChart3, Shield, LogOut, Home, ArrowLeft } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Guard: Redirect if not authenticated (must wrap in useEffect in actual page, but good to check here)
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  // Define navigation options based on role
  const navItems = [
    {
      name: 'Orders & Billing',
      href: '/orders',
      icon: <ShoppingBag size={18} />,
      roles: ['CUSTOMER', 'DEVELOPER', 'ADMIN'],
    },
    {
      name: 'Developer Keys',
      href: '/keys',
      icon: <Key size={18} />,
      roles: ['DEVELOPER', 'ADMIN'],
    },
    {
      name: 'Usage Metrics',
      href: '/metrics',
      icon: <BarChart3 size={18} />,
      roles: ['DEVELOPER', 'ADMIN'],
    },
    {
      name: 'Admin Console',
      href: '/admin/products',
      icon: <Shield size={18} />,
      roles: ['ADMIN'],
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-display">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              COGNA
            </span>
            <Link
              href="/"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              title="Return to Marketplace"
            >
              <Home size={16} />
            </Link>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-1">
            {visibleNavItems.map((item, idx) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer profile/logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
              {user.fullName.split(' ')[0][0]}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-700 leading-none">{user.fullName}</h4>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-1">{user.role}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent transition"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace content */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between shrink-0">
          <h1 className="text-sm font-bold text-slate-800">
            {pathname.startsWith('/admin') ? 'Admin Control Dashboard' : 'Developer Workspace'}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
            >
              <ArrowLeft size={12} /> Marketplace
            </Link>
          </div>
        </header>

        {/* Scrollable body content */}
        <main className="flex-grow p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
