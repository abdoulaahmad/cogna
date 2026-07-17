'use client'

import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { useAuthStore } from '@/stores/auth'
import { Check, Clipboard, CreditCard, Eye, EyeOff, KeyRound, Loader2, LockKeyhole, RefreshCw, ShieldCheck, Webhook } from 'lucide-react'

type PaystackStatus = {
  gateway: 'PAYSTACK'; configured: boolean; enabled: boolean; source: 'ADMIN_PORTAL'|'ENVIRONMENT'|'NONE';
  mode: 'TEST'|'LIVE'|null; publicKey: string|null; secretKey: string|null; webhookPath: string; updatedAt: string|null
}

export default function PaymentGatewaysPage() {
  const { user } = useAuthStore()
  const canEdit = user?.adminRole === 'SUPER_ADMIN'
  const [status, setStatus] = React.useState<PaystackStatus | null>(null)
  const [publicKey, setPublicKey] = React.useState('')
  const [secretKey, setSecretKey] = React.useState('')
  const [enabled, setEnabled] = React.useState(false)
  const [showSecret, setShowSecret] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try { const response=await api.get('/admin/payment-gateways/paystack'); setStatus(response.data.data); setEnabled(response.data.data.enabled) }
    catch (requestError: unknown) { setError(getErrorMessage(requestError, 'Unable to load Paystack configuration.')) }
    finally { setLoading(false) }
  }, [])
  React.useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer) }, [load])

  const apiOrigin = typeof window !== 'undefined' ? new URL(api.defaults.baseURL || '/api/v1', window.location.origin).origin : ''
  const webhookUrl = status ? `${apiOrigin}${status.webhookPath}` : ''

  async function save(event: React.FormEvent) {
    event.preventDefault(); if(!canEdit) return
    setSaving(true); setError(null); setMessage(null)
    try {
      const payload: { publicKey?: string; secretKey?: string; enabled: boolean } = { enabled }
      if(publicKey.trim()) payload.publicKey=publicKey.trim()
      if(secretKey.trim()) payload.secretKey=secretKey.trim()
      const response=await api.put('/admin/payment-gateways/paystack',payload)
      setStatus(response.data.data); setPublicKey(''); setSecretKey(''); setMessage('Paystack configuration saved and activated for new transactions.')
    } catch (requestError: unknown) { setError(getErrorMessage(requestError, 'Unable to save Paystack configuration.')) }
    finally { setSaving(false) }
  }

  async function copyWebhook() { await navigator.clipboard.writeText(webhookUrl); setCopied(true); window.setTimeout(()=>setCopied(false),1800) }

  if(loading) return <div className="grid min-h-[65vh] place-items-center"><Loader2 className="animate-spin text-[#D4AF37]" size={28}/></div>

  return <div className="space-y-8 p-5 sm:p-8 xl:p-10">
    <section className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#D4AF37]">Payments infrastructure</p><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Payment gateways</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100/55">Configure the credentials Cogna uses for checkout, wallet funding, server verification, and signed webhooks.</p></div><button onClick={() => void load()} className="flex w-fit items-center gap-2 rounded-full border border-emerald-100/15 px-4 py-2.5 text-xs font-bold text-emerald-100/60 hover:text-white"><RefreshCw size={14}/>Refresh status</button></section>

    {error && <div role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-950/25 p-4 text-sm text-rose-100">{error}</div>}
    {message && <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100"><Check size={17}/>{message}</div>}

    <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <article className="rounded-3xl border border-emerald-100/10 bg-white/[.04] p-6 sm:p-7"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/10 text-sky-300"><CreditCard size={23}/></span><span className={status?.configured && status.enabled ? 'rounded-full bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300' : 'rounded-full bg-amber-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-200'}>{status?.configured && status.enabled ? 'Connected' : 'Not active'}</span></div><h2 className="mt-6 text-2xl font-black">Paystack</h2><p className="mt-2 text-sm text-emerald-100/48">Cards, bank transfer, and verified wallet deposits.</p><dl className="mt-7 space-y-4 border-t border-emerald-100/10 pt-6 text-xs"><div className="flex justify-between gap-4"><dt className="text-emerald-100/40">Environment</dt><dd className="font-bold text-white">{status?.mode || 'Not detected'}</dd></div><div className="flex justify-between gap-4"><dt className="text-emerald-100/40">Configuration source</dt><dd className="font-bold text-white">{status?.source.replace('_',' ')}</dd></div><div className="flex justify-between gap-4"><dt className="text-emerald-100/40">Public key</dt><dd className="font-mono text-emerald-100/70">{status?.publicKey || 'Not configured'}</dd></div><div className="flex justify-between gap-4"><dt className="text-emerald-100/40">Secret key</dt><dd className="font-mono text-emerald-100/70">{status?.secretKey || 'Not configured'}</dd></div></dl></article>

      <form onSubmit={save} className="rounded-3xl border border-emerald-100/10 bg-white/[.04] p-6 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#F8D56B]"><KeyRound size={18}/></span><div><h2 className="font-bold">Paystack credentials</h2><p className="mt-1 text-xs leading-5 text-emerald-100/42">Leave key fields blank to keep the currently stored values. Credentials are encrypted and never returned by the API.</p></div></div><div className="mt-7 grid gap-5"><label className="text-xs font-bold text-emerald-100/65">Public key<input disabled={!canEdit} value={publicKey} onChange={(e)=>setPublicKey(e.target.value)} placeholder={status?.publicKey || 'pk_test_…'} autoComplete="off" className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3.5 font-mono text-sm text-white outline-none placeholder:text-emerald-100/25 focus:border-[#D4AF37]/60 disabled:cursor-not-allowed disabled:opacity-55"/></label><label className="text-xs font-bold text-emerald-100/65">Secret key<div className="relative mt-2"><input disabled={!canEdit} type={showSecret?'text':'password'} value={secretKey} onChange={(e)=>setSecretKey(e.target.value)} placeholder={status?.secretKey || 'sk_test_…'} autoComplete="new-password" className="w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3.5 pr-12 font-mono text-sm text-white outline-none placeholder:text-emerald-100/25 focus:border-[#D4AF37]/60 disabled:cursor-not-allowed disabled:opacity-55"/><button type="button" disabled={!canEdit} onClick={()=>setShowSecret((value)=>!value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100/35 hover:text-white" aria-label={showSecret?'Hide secret':'Show secret'}>{showSecret?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label><label className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100/10 bg-black/15 p-4"><span><span className="block text-sm font-bold">Enable Paystack</span><span className="mt-1 block text-xs text-emerald-100/40">New checkouts will use this configuration.</span></span><input disabled={!canEdit} type="checkbox" checked={enabled} onChange={(e)=>setEnabled(e.target.checked)} className="h-5 w-5 accent-[#D4AF37]"/></label></div>{canEdit?<button disabled={saving} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3.5 text-sm font-black text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50">{saving?<Loader2 className="animate-spin" size={17}/>:<ShieldCheck size={17}/>} {saving?'Saving encrypted configuration…':'Save Paystack setup'}</button>:<p className="mt-6 flex gap-2 rounded-2xl border border-amber-200/10 bg-amber-200/[.04] p-4 text-xs leading-5 text-amber-100/55"><LockKeyhole className="shrink-0 text-[#D4AF37]" size={16}/>Only a Super Admin can rotate credentials or enable this gateway.</p>}</form>
    </section>

    <section className="rounded-3xl border border-emerald-100/10 bg-white/[.035] p-6 sm:p-7"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Webhook size={18}/></span><div><h2 className="font-bold">Paystack webhook</h2><p className="mt-1 text-xs leading-5 text-emerald-100/42">Add this URL in Paystack Dashboard → Settings → API Keys & Webhooks. It handles both marketplace payments and wallet funding.</p></div></div><div className="mt-5 flex flex-col gap-3 rounded-2xl border border-emerald-100/10 bg-black/20 p-3 sm:flex-row sm:items-center"><code className="min-w-0 flex-1 break-all px-2 text-xs text-emerald-100/70">{webhookUrl}</code><button type="button" onClick={() => void copyWebhook()} className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-100/15 px-4 py-2.5 text-xs font-bold text-emerald-100/60 hover:text-white">{copied?<Check size={15}/>:<Clipboard size={15}/>} {copied?'Copied':'Copy URL'}</button></div><p className="mt-4 flex gap-2 text-xs leading-5 text-emerald-100/38"><LockKeyhole className="shrink-0 text-[#D4AF37]" size={15}/>Cogna validates Paystack’s HMAC-SHA512 signature and verifies the transaction amount and currency before changing financial state.</p></section>
  </div>
}