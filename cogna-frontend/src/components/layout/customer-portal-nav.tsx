'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, BookOpen, Boxes, ChevronDown, Code2, Headphones, KeyRound, LayoutDashboard, LogOut, Menu, ReceiptText, UserRound, WalletCards, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

const topLinks = [{ href: '/dashboard', label: 'Overview' }, { href: '/wallet', label: 'Wallet' }, { href: '/orders', label: 'Orders' }, { href: '/notifications', label: 'Alerts' }, { href: '/support', label: 'Support' }, { href: '/profile', label: 'Account' }];
const sidebarLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/catalog', label: 'Browse Catalog', icon: Boxes },
  { href: '/wallet', label: 'Wallet', icon: WalletCards },
  { href: '/orders', label: 'Orders', icon: ReceiptText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/support', label: 'Support', icon: Headphones },
  { href: '/profile', label: 'Account', icon: UserRound },
];
const developerLinks = [
  { href: '/keys', label: 'API Keys', icon: KeyRound },
  { href: '/metrics', label: 'API Usage', icon: Code2 },
  { href: '/docs', label: 'API Docs', icon: BookOpen },
];

export default function CustomerPortalNav({ current, variant = 'top' }: { current?: string; variant?: 'top' | 'sidebar' }) {
  const router = useRouter();
  const { user, refreshToken, clearAuth, updateUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!user || user.isDeveloper !== undefined) return;
    const timer = window.setTimeout(() => {
      void api.get('/auth/me').then((response) => {
        if (response.data.success) updateUser(response.data.data);
      }).catch(() => undefined);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [updateUser, user]);
  const logout = async () => {
    try { if (refreshToken) await api.post('/auth/logout', { refreshToken }); } catch { /* Local session must still be cleared. */ }
    clearAuth(); router.replace('/login');
  };

  if (variant === 'sidebar') {
    const links = user?.isDeveloper || user?.role === 'DEVELOPER' ? [...sidebarLinks, ...developerLinks] : sidebarLinks;
    const initials = user?.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CG';
    return <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between border-b border-emerald-100/10 bg-[#03120F]/95 px-5 backdrop-blur-xl lg:left-64 lg:px-8">
        <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-100/40">Customer portal</p><p className="mt-1 text-sm font-bold text-white">Account overview</p></div>
        <div className="flex items-center gap-2 sm:gap-3"><Link href="/wallet/fund" className="hidden rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2.5 text-xs font-bold text-[#F8D56B] hover:bg-[#D4AF37]/20 sm:block">Add funds</Link><Link href="/notifications" aria-label="Notifications" className="rounded-xl border border-emerald-100/10 p-2.5 text-emerald-100/65 hover:text-white"><Bell size={18}/></Link><Link href="/profile" className="hidden items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-white/[0.04] sm:flex"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#D4AF37,#F8D56B)] text-xs font-black text-[#062C23]">{initials}</span><span className="max-w-32 truncate text-left"><span className="block truncate text-xs font-bold text-white">{user?.fullName || 'Cogna user'}</span><span className="block text-[10px] text-emerald-100/45">My account</span></span><ChevronDown size={14} className="text-emerald-100/40"/></Link><button type="button" onClick={() => setOpen(!open)} className="rounded-xl border border-emerald-100/10 p-2.5 text-white lg:hidden" aria-label="Toggle navigation">{open ? <X size={18}/> : <Menu size={18}/>}</button></div>
      </header>
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-[60] flex w-64 flex-col border-r border-emerald-100/10 bg-[#02110E] transition-transform lg:translate-x-0`}>
        <div className="flex h-[72px] items-center justify-between border-b border-emerald-100/10 px-6"><Link href="/dashboard"><Image src="/logo-cogna.png" alt="Cogna" width={166} height={42} className="h-auto w-[154px]" priority/></Link><button type="button" onClick={() => setOpen(false)} className="text-emerald-100/60 lg:hidden" aria-label="Close navigation"><X size={19}/></button></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setOpen(false)} className={current === href ? 'flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-[#F8D56B] shadow-[inset_0_0_24px_rgba(16,185,129,.05)]' : 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-50/65 hover:bg-white/[0.04] hover:text-white'}><Icon size={18} strokeWidth={1.8}/>{label}</Link>)}</nav>
        <div className="border-t border-emerald-100/10 p-4"><Link href="/support" className="flex items-center gap-3 rounded-xl border border-emerald-100/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold text-emerald-100/70"><Headphones size={17} className="text-[#F8D56B]"/>Need help?</Link><button type="button" onClick={() => void logout()} className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-rose-200/80 hover:bg-rose-400/10"><LogOut size={17}/>Sign out</button></div>
      </aside>
      {open && <button type="button" aria-label="Close menu overlay" onClick={() => setOpen(false)} className="fixed inset-0 z-[55] bg-black/65 lg:hidden"/>}
    </>;
  }

  return <header className="sticky top-0 z-50 border-b border-emerald-100/10 bg-[#062C23]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href="/dashboard" className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Cogna portal</Link><nav className="hidden items-center gap-5 lg:flex">{topLinks.map((link) => <Link key={link.href} href={link.href} className={current === link.href ? 'text-xs font-bold text-[#F8D56B]' : 'text-xs font-semibold text-emerald-100/65 hover:text-white'}>{link.label}</Link>)}</nav><div className="hidden items-center gap-4 lg:flex"><span className="max-w-36 truncate text-xs font-semibold text-emerald-100/65">{user?.fullName}</span><button type="button" onClick={() => void logout()} className="rounded-full border border-emerald-100/15 p-2 text-emerald-100/65 hover:border-rose-200/40 hover:text-rose-100" aria-label="Sign out"><LogOut size={15}/></button></div><button type="button" onClick={() => setOpen(!open)} className="rounded-full border border-emerald-100/15 p-2 text-emerald-100 lg:hidden" aria-label="Toggle navigation">{open ? <X size={17}/> : <Menu size={17}/>}</button></div>{open && <nav className="border-t border-emerald-100/10 px-5 py-3 lg:hidden">{topLinks.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-3 text-sm font-semibold text-emerald-100/75">{link.label}</Link>)}<button type="button" onClick={() => void logout()} className="mt-2 text-sm font-bold text-rose-200">Sign out</button></nav>}</header>;
}