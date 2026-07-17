import Link from 'next/link'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertTriangle, Loader2, Search } from 'lucide-react'

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#D4AF37]">{eyebrow}</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-emerald-100/55">{description}</p></div>{action}</div>
}

export function AdminPanel({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`rounded-3xl border border-emerald-100/10 bg-white/[.04] ${className}`}>{children}</section> }
export function AdminError({ message }: { message: string }) { return <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-300/20 bg-rose-950/25 p-4 text-sm text-rose-100"><AlertTriangle size={17}/>{message}</div> }
export function AdminLoading({ label = 'Loading live data…' }: { label?: string }) { return <div className="grid min-h-52 place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#D4AF37]" size={25}/><p className="mt-3 text-xs text-emerald-100/45">{label}</p></div></div> }
export function AdminEmpty({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) { return <div className="grid min-h-56 place-items-center p-8 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[.05] text-emerald-100/35"><Icon size={21}/></span><p className="mt-4 text-sm font-bold text-white">{title}</p><p className="mt-2 text-xs text-emerald-100/38">{description}</p></div></div> }
export function AdminSearch({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-100/30" size={16}/><input value={value} onChange={(event)=>onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-emerald-100/12 bg-black/20 py-3 pl-11 pr-4 text-xs text-white outline-none placeholder:text-emerald-100/25 focus:border-[#D4AF37]/50"/></label> }

const tabs = [{ href:'/admin/products', label:'Products' },{ href:'/admin/categories', label:'Categories' },{ href:'/admin/providers', label:'Providers' },{ href:'/admin/providers/health', label:'Provider health' }]
export function CatalogTabs({ current }: { current: string }) { return <nav className="flex max-w-full gap-2 overflow-x-auto pb-1">{tabs.map((tab)=><Link key={tab.href} href={tab.href} className={current===tab.href?'whitespace-nowrap rounded-full bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-[#062C23]':'whitespace-nowrap rounded-full border border-emerald-100/12 px-4 py-2.5 text-xs font-bold text-emerald-100/55 hover:text-white'}>{tab.label}</Link>)}</nav> }

export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-xs font-black text-[#062C23] transition hover:bg-[#F8D56B] disabled:cursor-not-allowed disabled:opacity-50'
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-full border border-emerald-100/15 bg-white/[.03] px-4 py-2.5 text-xs font-bold text-emerald-100/60 transition hover:border-[#D4AF37]/35 hover:text-white disabled:opacity-45'
export const fieldClass = 'mt-2 w-full rounded-2xl border border-emerald-100/12 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-emerald-100/25 focus:border-[#D4AF37]/55 disabled:opacity-50'