'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import {
  Activity, Boxes, ClipboardList, CreditCard, FolderTree, History,
  Home, LayoutDashboard, LogOut, Menu, Package, ShieldCheck, UserCog, UsersRound, WalletCards, X,
} from 'lucide-react'

type NavItem = { name: string; href: string; icon: React.ComponentType<{ size?: number; className?: string }> }

const navigation: Array<{ label: string; items: NavItem[] }> = [
  { label: 'Overview', items: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
  ] },
  { label: 'Commerce', items: [
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Fulfillment providers', href: '/admin/providers', icon: Boxes },
    { name: 'Provider health', href: '/admin/providers/health', icon: Activity },
    { name: 'Payment gateways', href: '/admin/payment-gateways', icon: CreditCard },
  ] },
  { label: 'Finance & control', items: [
    { name: 'User accounts', href: '/admin/users', icon: UserCog },
    { name: 'Wallet adjustments', href: '/admin/adjustments', icon: WalletCards },
    { name: 'Audit logs', href: '/admin/audit-logs', icon: History },
  ] },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, clearAuth, hasHydrated } = useAuthStore()
  const [menuOpen, setMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (!hasHydrated) return
    if (!isAuthenticated) router.replace('/login?redirect=/admin/dashboard')
    else if (user?.role !== 'ADMIN') router.replace('/dashboard')
  }, [isAuthenticated, router, user, hasHydrated])

  if (!hasHydrated || !isAuthenticated || user?.role !== 'ADMIN') return null

  const signOut = () => {
    clearAuth()
    router.push('/login')
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b border-emerald-100/10 px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#F8D56B]"><ShieldCheck size={21}/></span>
          <img src="/logo-cogna.png" alt="Cogna" className="h-6 w-auto" />
        </Link>
        <button type="button" onClick={() => setMenuOpen(false)} className="text-emerald-100/60 lg:hidden" aria-label="Close navigation"><X size={20}/></button>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        {navigation.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-emerald-100/35">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon
                return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={active ? 'flex items-center gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/12 px-3 py-3 text-sm font-bold text-[#F8D56B]' : 'flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-semibold text-emerald-100/58 transition hover:bg-white/[.05] hover:text-white'}><Icon size={17}/>{item.name}</Link>
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-emerald-100/10 p-4">
        <div className="rounded-2xl border border-emerald-100/10 bg-white/[.04] p-3">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#D4AF37] text-xs font-black text-[#062C23]">{user.fullName?.charAt(0) || 'A'}</span><span className="min-w-0"><span className="block truncate text-xs font-bold text-white">{user.fullName}</span><span className="block truncate text-[10px] text-emerald-100/45">{user.adminRole || 'ADMIN'}</span></span></div>
          <button type="button" onClick={signOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-100/10 px-3 py-2 text-xs font-bold text-emerald-100/55 hover:border-rose-300/25 hover:text-rose-200"><LogOut size={14}/>Sign out</button>
        </div>
      </div>
    </div>
  )

  return <div className="min-h-screen bg-[#041612] font-display text-white overflow-x-hidden">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-emerald-100/10 bg-[#03110e] lg:block">{sidebar}</aside>
    {menuOpen && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMenuOpen(false)}><aside className="h-full w-[86%] max-w-80 border-r border-emerald-100/10 bg-[#03110e]" onClick={(event) => event.stopPropagation()}>{sidebar}</aside></div>}

    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-emerald-100/10 bg-[#041612]/90 px-5 backdrop-blur-xl sm:px-8">
        <div className="flex items-center gap-3"><button type="button" onClick={() => setMenuOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-100/10 text-emerald-100/70 lg:hidden" aria-label="Open navigation"><Menu size={19}/></button><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#D4AF37]">Admin control center</p><p className="mt-1 text-sm font-semibold text-emerald-100/60">Live marketplace operations</p></div></div>
        <div className="flex items-center gap-2"><Link href="/dashboard" className="hidden items-center gap-2 rounded-xl border border-emerald-100/10 px-3 py-2 text-xs font-bold text-emerald-100/55 hover:text-white sm:flex"><UsersRound size={15}/>Customer portal</Link><Link href="/" className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-100/10 text-emerald-100/55 hover:text-white" title="Marketplace"><Home size={17}/></Link></div>
      </header>
      <main className="min-h-[calc(100vh-5rem)] bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.08),transparent_32%),radial-gradient(circle_at_25%_0,rgba(212,175,55,.06),transparent_24%)]">{children}</main>
    </div>
  </div>
}