'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { ShoppingCart, LogOut, Menu, X } from 'lucide-react';
import CartDrawer from '@/components/product/cart-drawer';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { cartItem } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/catalog' },
    { name: 'About', href: '#about' },
    { name: 'Find Us', href: '#find-us' },
    { name: 'Pages', href: '#pages' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#081A16] w-full font-display">
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-16 w-full">
        <div className="flex h-20 items-center justify-between">
          
          {/* LEFT: Compact logo with breathing room */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 focus:outline-none">
              <img
                src="/logo-cogna.png"
                alt="Cogna Logo"
                className="h-7 w-auto object-contain hover:opacity-90 transition-opacity"
              />
            </Link>
          </div>

          {/* CENTER: Evenly spaced navigation, no dropdowns */}
          <nav className="hidden md:flex items-center space-x-10 text-xs font-bold text-slate-400 tracking-wide">
            {navLinks.map((link, idx) => (
              <Link
                key={idx}
                href={link.href}
                className="hover:text-[#D4AF37] transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Cart icon & Primary rounded CTA button perfectly aligned */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Cart Icon Toggle */}
            <button
              onClick={() => setCartOpen(true)}
              className="text-slate-400 hover:text-[#D4AF37] p-2 transition-colors duration-200 relative focus:outline-none"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              {cartItem ? (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#D4AF37] ring-2 ring-[#080b14]" />
              ) : null}
            </button>

            {/* Rounded CTA Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={user?.role === 'ADMIN' ? '/admin/products' : '/orders'}
                  className="rounded-full bg-[#D4AF37] hover:bg-[#B8860B] px-5 py-2.5 text-xs font-bold text-slate-950 transition-all duration-200 shadow-sm border border-[#F8D56B]/20 h-10 flex items-center"
                >
                  Workspace Portal
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-rose-500 p-2 transition-colors duration-200 focus:outline-none"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-[#D4AF37] hover:bg-[#B8860B] px-5 py-2.5 text-xs font-bold text-slate-950 transition-all duration-200 shadow-sm border border-[#F8D56B]/20 h-10 flex items-center"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setCartOpen(true)}
              className="text-slate-400 hover:text-[#D4AF37] p-2 relative"
            >
              <ShoppingCart size={18} />
              {cartItem ? (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#D4AF37]" />
              ) : null}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-[#D4AF37] p-2 transition-colors focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen ? (
        <div className="md:hidden bg-[#081A16] border-t border-slate-800/20 px-6 py-4 space-y-4 text-sm font-bold text-slate-400">
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block hover:text-[#D4AF37] transition"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800/20">
            {isAuthenticated ? (
              <div className="space-y-4">
                <Link
                  href={user?.role === 'ADMIN' ? '/admin/products' : '/orders'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center rounded-full bg-[#D4AF37] hover:bg-[#B8860B] py-3 text-xs font-bold text-slate-950 transition"
                >
                  Workspace Portal
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-center block py-2 text-rose-400 hover:text-rose-350 transition font-bold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center rounded-full bg-[#D4AF37] hover:bg-[#B8860B] py-3 text-xs font-bold text-slate-950 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {/* Slide Drawer Cart overlay */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
