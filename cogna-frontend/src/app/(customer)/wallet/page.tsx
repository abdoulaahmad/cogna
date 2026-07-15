'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CreditCard, History, WalletCards } from 'lucide-react'
import { api } from '@/lib/api'

type Wallet = { availableBalance: string; pendingBalance: string; lifetimeFunded: string; lifetimeSpent: string; currency: string }
type Ledger = { id: string; type: string; direction: 'CREDIT' | 'DEBIT'; amount: string; createdAt: string; reference: string }

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Ledger[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { void (async () => {
    try {
      const [summary, history] = await Promise.all([api.get('/wallet'), api.get('/wallet/transactions')])
      setWallet(summary.data.data); setTransactions(history.data.data.items)
    } catch { setError('Unable to load your wallet right now.') }
  })() }, [])

  const money = (value: string) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: wallet?.currency ?? 'NGN' }).format(Number(value))
  return <main className="min-h-screen bg-[#062C23] px-5 py-12 text-white"><div className="mx-auto max-w-5xl">
    <p className="text-xs font-bold uppercase tracking-[.22em] text-[#D4AF37]">Cogna wallet</p><div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="font-display text-4xl font-bold">Your balance, on demand.</h1><p className="mt-2 text-emerald-100/70">Fund, track, and spend securely from one account.</p></div><Link href="/wallet/fund" className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23]"><CreditCard size={17}/> Fund wallet</Link></div>
    {error ? <p className="mt-8 rounded-2xl border border-rose-300/30 bg-rose-950/30 p-4 text-sm text-rose-100">{error}</p> : null}
    <section className="mt-9 rounded-3xl border border-emerald-100/15 bg-white/10 p-7 shadow-premium-dark backdrop-blur-xl"><div className="flex items-center gap-3 text-emerald-100"><WalletCards className="text-[#D4AF37]"/><span className="text-sm font-bold">Available balance</span></div><p className="mt-5 font-display text-5xl font-bold">{wallet ? money(wallet.availableBalance) : '—'}</p><div className="mt-8 grid gap-4 sm:grid-cols-3"><Stat label="Pending" value={wallet ? money(wallet.pendingBalance) : '—'}/><Stat label="Total funded" value={wallet ? money(wallet.lifetimeFunded) : '—'}/><Stat label="Total spent" value={wallet ? money(wallet.lifetimeSpent) : '—'}/></div></section>
    <section className="mt-8 rounded-3xl border border-emerald-100/15 bg-white/5 p-6 backdrop-blur-xl"><div className="flex items-center gap-2"><History className="text-[#D4AF37]" size={19}/><h2 className="font-display text-xl font-bold">Recent activity</h2></div><div className="mt-5 divide-y divide-emerald-100/10">{transactions.length ? transactions.map(t => <div key={t.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">{t.type}</p><p className="mt-1 text-xs text-emerald-100/55">{new Date(t.createdAt).toLocaleDateString()} · {t.reference}</p></div><p className={t.direction === 'CREDIT' ? 'font-bold text-emerald-300' : 'font-bold text-rose-300'}>{t.direction === 'CREDIT' ? '+' : '-'}{money(t.amount)}</p></div>) : <p className="py-8 text-sm text-emerald-100/60">Your verified wallet activity will appear here.</p>}</div></section>
  </div></main>
}
function Stat({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-black/15 p-4"><p className="text-xs font-bold uppercase tracking-wider text-emerald-100/55">{label}</p><p className="mt-2 text-lg font-bold">{value}</p></div> }