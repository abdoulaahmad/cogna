'use client'

import React from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, CreditCard, LifeBuoy, RefreshCw, ShoppingBag, TrendingUp, WalletCards } from 'lucide-react'

type MetricsData = { gmv: number; liability: number; fundingSuccessRate: number; orderCounts: Record<string, number>; supportBacklog: number }
type GatewayStatus = { configured: boolean; enabled: boolean; mode: 'TEST' | 'LIVE' | null; source: 'ADMIN_PORTAL' | 'ENVIRONMENT' | 'NONE' }

const money = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 })

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = React.useState<MetricsData | null>(null)
  const [gateway, setGateway] = React.useState<GatewayStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [metricsResponse, gatewayResponse] = await Promise.all([
        api.get('/admin/dashboard/metrics'),
        api.get('/admin/payment-gateways/paystack').catch(() => null),
      ])
      setMetrics(metricsResponse.data.data)
      setGateway(gatewayResponse?.data.data ?? null)
    } catch (requestError: unknown) { setError(getErrorMessage(requestError, 'Unable to load marketplace telemetry.')) }
    finally { setLoading(false) }
  }, [])

  React.useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [load])

  if (loading) return <div className="grid min-h-[65vh] place-items-center"><div className="text-center"><RefreshCw className="mx-auto animate-spin text-[#D4AF37]" size={28}/><p className="mt-4 text-sm text-emerald-100/55">Loading live operations…</p></div></div>
  if (error || !metrics) return <div className="p-6 sm:p-8"><div className="max-w-xl rounded-3xl border border-rose-300/20 bg-rose-950/25 p-6 text-rose-100"><div className="flex items-center gap-2 font-bold"><AlertTriangle size={18}/>Telemetry load failure</div><p className="mt-2 text-sm text-rose-100/65">{error}</p><button onClick={() => void load()} className="mt-5 rounded-full bg-rose-200 px-4 py-2 text-xs font-bold text-rose-950">Retry</button></div></div>

  const totalOrders = Object.values(metrics.orderCounts).reduce((sum, value) => sum + value, 0)
  const cards = [
    { label: 'Gross merchandise value', value: money.format(metrics.gmv), note: 'Completed marketplace orders', icon: TrendingUp },
    { label: 'Wallet liability', value: money.format(metrics.liability), note: 'Available and pending balances', icon: WalletCards },
    { label: 'Funding success', value: `${metrics.fundingSuccessRate}%`, note: 'Verified settled deposits', icon: CheckCircle2 },
    { label: 'Total orders', value: totalOrders.toLocaleString(), note: `${metrics.supportBacklog} verification tasks`, icon: ShoppingBag },
  ]

  return <div className="space-y-8 p-5 sm:p-8 xl:p-10">
    <section className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#D4AF37]">Operations overview</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Marketplace command center</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/55">Monitor real transaction, wallet, fulfillment, and payment infrastructure data.</p></div><button onClick={() => void load()} className="flex w-fit items-center gap-2 rounded-full border border-emerald-100/15 bg-white/[.04] px-4 py-2.5 text-xs font-bold text-emerald-100/70 hover:border-[#D4AF37]/40 hover:text-[#F8D56B]"><RefreshCw size={14}/>Refresh live data</button></section>

    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon }) => <article key={label} className="relative overflow-hidden rounded-3xl border border-emerald-100/10 bg-white/[.045] p-6 shadow-2xl shadow-black/10"><div className="flex items-start justify-between"><p className="text-xs font-bold text-emerald-100/48">{label}</p><span className="grid h-10 w-10 place-items-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#F8D56B]"><Icon size={18}/></span></div><p className="mt-6 text-3xl font-black tracking-tight">{value}</p><p className="mt-2 text-xs text-emerald-100/38">{note}</p></article>)}</section>

    <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <article className="rounded-3xl border border-emerald-100/10 bg-white/[.035] p-6 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-bold">Order pipeline</h2><p className="mt-1 text-xs text-emerald-100/42">Current volume by processing state</p></div><Link href="/admin/orders" className="flex items-center gap-1 text-xs font-bold text-[#F8D56B]">Review orders <ArrowRight size={14}/></Link></div><div className="mt-7 space-y-5">{['COMPLETED','PROCESSING','PENDING','FAILED','CANCELLED'].map((status) => { const count=metrics.orderCounts[status]||0; const percent=totalOrders ? Math.round(count/totalOrders*100) : 0; return <div key={status}><div className="mb-2 flex justify-between text-xs"><span className="font-bold text-emerald-100/58">{status}</span><span className="text-emerald-100/40">{count} · {percent}%</span></div><div className="h-2 overflow-hidden rounded-full bg-emerald-100/[.07]"><div className={status==='COMPLETED'?'h-full rounded-full bg-emerald-400':status==='FAILED'?'h-full rounded-full bg-rose-400':'h-full rounded-full bg-[#D4AF37]'} style={{width:`${percent}%`}}/></div></div>})}</div></article>

      <article className="rounded-3xl border border-emerald-100/10 bg-white/[.035] p-6 sm:p-7"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sky-400/10 text-sky-300"><CreditCard size={20}/></span><span className={gateway?.configured && gateway.enabled ? 'rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300' : 'rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200'}>{gateway?.configured && gateway.enabled ? 'Ready' : 'Setup required'}</span></div><h2 className="mt-6 text-xl font-black">Paystack</h2><p className="mt-2 text-sm leading-6 text-emerald-100/48">{gateway?.configured ? `${gateway.mode || 'Unknown'} credentials loaded from ${gateway.source.toLowerCase().replace('_',' ')}.` : 'Add Paystack credentials before accepting card or wallet funding payments.'}</p><Link href="/admin/payment-gateways" className="mt-6 flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-4 py-3 text-xs font-black text-[#062C23] hover:bg-[#F8D56B]">Open payment setup <ArrowRight size={14}/></Link><div className="mt-5 grid grid-cols-2 gap-3 border-t border-emerald-100/10 pt-5"><div><Clock3 size={15} className="text-[#D4AF37]"/><p className="mt-2 text-[10px] text-emerald-100/40">Webhook settlement</p></div><div><CircleDollarSign size={15} className="text-[#D4AF37]"/><p className="mt-2 text-[10px] text-emerald-100/40">Verified amounts</p></div></div></article>
    </section>

    <section className="flex items-center gap-3 rounded-2xl border border-amber-200/10 bg-amber-200/[.04] px-5 py-4 text-xs text-amber-100/60"><LifeBuoy size={17} className="shrink-0 text-[#D4AF37]"/>All financial actions and gateway configuration changes are recorded in the audit log.</section>
  </div>
}