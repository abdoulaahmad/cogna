'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { ShoppingCart, User, LogOut, Menu, X, Terminal, Shield } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#080b14]/90 backdrop-blur-md border-b border-slate-800/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">COGNA</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex space-x-8 text-sm font-semibold text-slate-400 font-display">
            <Link href="/" className="hover:text-white transition-colors duration-200">
              Home
            </Link>
            <Link href="/catalog" className="hover:text-white transition-colors duration-200">
              API Catalog
            </Link>
            {isAuthenticated ? (
              <>
                {user?.role === 'DEVELOPER' || user?.role === 'ADMIN' ? (
                  <Link href="/keys" className="hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                    <Terminal size={14} /> Developer Portal
                  </Link>
                ) : null}
                {user?.role === 'ADMIN' ? (
                  <Link href="/admin/products" className="hover:text-white transition-colors duration-200 flex items-center gap-1.5">
                    <Shield size={14} /> Admin Dashboard
                  </Link>
                ) : null}
              </>
            ) : null}
          </nav>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/cart"
              className="text-slate-400 hover:text-white p-2 transition-colors duration-200 relative"
            >
              <ShoppingCart size={20} />
              {/* Optional cart bubble count */}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-semibold font-display bg-slate-800/40 px-2.5 py-1 rounded-full border border-slate-700/20">
                  {user?.fullName.split(' ')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-500 p-2 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold font-display text-white transition-all duration-200 shadow-sm border border-indigo-700/10"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen ? (
        <div className="md:hidden bg-[#080b14] border-b border-slate-800/40 px-4 pt-2 pb-4 space-y-3 font-display">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800/40 hover:text-white transition"
          >
            Home
          </Link>
          <Link
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800/40 hover:text-white transition"
          >
            API Catalog
          </Link>
          {isAuthenticated ? (
            <>
              {user?.role === 'DEVELOPER' || user?.role === 'ADMIN' ? (
                <Link
                  href="/keys"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800/40 hover:text-white transition"
                >
                  Developer Portal
                </Link>
              ) : null}
              {user?.role === 'ADMIN' ? (
                <Link
                  href="/admin/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-slate-300 hover:bg-slate-800/40 hover:text-white transition"
                >
                  Admin Dashboard
                </Link>
              ) : null}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition"
            >
              Sign In
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}
