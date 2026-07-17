'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Boxes, CheckCircle2, Clock3, CreditCard, RefreshCw, ShoppingBag, TrendingUp, WalletCards } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
import type { Product } from '@/components/product/product-card';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';

type Dashboard = {
  wallet: { availableBalance: number; pendingBalance: number; lifetimeFunded: number; lifetimeSpent: number; currency?: string };
  orderStats: { pendingCount: number; completedCount: number };
  recentOrders: Array<{ id: string; status: string; amount: string; currency: string; createdAt: string; product: { name: string } }>;
  recentTransactions: Array<{ id: string; type: string; direction: string; amount: string; balanceAfter: string; createdAt: string }>;
};

const money = (amount: number | string, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(amount));
const statusTone = (status: string) => status === 'COMPLETED' ? 'bg-emerald-400/10 text-emerald-300' : status === 'FAILED' || status === 'CANCELLED' ? 'bg-rose-400/10 text-rose-200' : 'bg-amber-300/10 text-amber-200';

export default function CustomerDashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCartItem } = useCartStore();
  const user = useAuthStore((state) => state.user);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [summary, catalog] = await Promise.all([
        api.get<{ success: boolean; data: Dashboard }>('/customer/dashboard'),
        api.get<{ success: boolean; data: Product[] }>('/products', { params: { page: 1, limit: 3 } }),
      ]);
      if (!summary.data.success || !catalog.data.success) throw new Error('Portal data could not be loaded.');
      setDashboard(summary.data.data); setProducts(catalog.data.data);
    } catch (requestError: unknown) { setError(getErrorMessage(requestError, 'Unable to load your portal.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const currency = dashboard?.wallet.currency || 'NGN';
  const firstName = user?.fullName?.split(/\s+/)[0] || 'there';

  return <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64"><CustomerPortalNav current="/dashboard" variant="sidebar"/><div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
    <div className="mx-auto max-w-[1440px]">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-semibold text-emerald-100/45">Welcome back</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{firstName} <span aria-hidden="true">👋</span></h1><p className="mt-2 text-sm text-emerald-100/55">Here&apos;s what&apos;s happening with your Cogna account.</p></div>{dashboard && <div className="flex min-w-[280px] items-center justify-between gap-5 rounded-2xl border border-emerald-100/10 bg-[#061B17] px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,.22)]"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-100/40">Wallet balance</p><p className="mt-1 text-2xl font-bold">{money(dashboard.wallet.availableBalance,currency)}</p></div><Link href="/wallet/fund" className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-[#062C23] hover:bg-[#F8D56B]">Add funds <CreditCard size={15}/></Link></div>}</section>

      {loading ? <div className="flex min-h-[520px] items-center justify-center"><RefreshCw className="animate-spin text-[#F8D56B]" size={30}/></div> : error ? <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-950/25 p-6 text-sm text-rose-100">{error}<button type="button" onClick={() => void load()} className="ml-3 font-bold text-[#F8D56B]">Retry</button></div> : dashboard ? <>
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<WalletCards size={21}/>} label="Available balance" value={money(dashboard.wallet.availableBalance,currency)} action="Add funds" href="/wallet/fund" tone="gold"/><Metric icon={<CheckCircle2 size={21}/>} label="Completed orders" value={String(dashboard.orderStats.completedCount)} action="View orders" href="/orders" tone="green"/><Metric icon={<Clock3 size={21}/>} label="Pending orders" value={String(dashboard.orderStats.pendingCount)} action="Track orders" href="/orders" tone="gold"/><Metric icon={<TrendingUp size={21}/>} label="Lifetime spent" value={money(dashboard.wallet.lifetimeSpent,currency)} action="Wallet activity" href="/wallet" tone="green"/></section>

        <section className="mt-5 rounded-2xl border border-emerald-100/10 bg-[#061915] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-xl font-bold">Browse live products</h2><p className="mt-1 text-xs text-emerald-100/50">Real availability and prices from the Cogna catalog.</p></div><Link href="/catalog" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-[#F8D56B]">View full catalog <ArrowRight size={15}/></Link></div><div className="mt-5 grid gap-4 lg:grid-cols-3">{products.map((product) => <DashboardProduct key={product.id} product={product} onPurchase={() => setCartItem(product)}/>)}</div>{products.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-emerald-100/15 px-5 py-8 text-center text-sm text-emerald-100/50">No products are currently available.</div>}</section>

        <section className="mt-5 grid gap-5 xl:grid-cols-2"><ActivityPanel title="Recent wallet activity" href="/wallet" empty="Your wallet activity will appear here.">{dashboard.recentTransactions.map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-4 border-b border-emerald-100/[.07] py-3.5 last:border-0"><div className="flex min-w-0 items-center gap-3"><span className={transaction.direction === 'CREDIT' ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300' : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200'}><WalletCards size={17}/></span><div className="min-w-0"><p className="truncate text-sm font-bold capitalize">{transaction.type.toLowerCase().replaceAll('_',' ')}</p><p className="mt-1 text-[11px] text-emerald-100/40">{new Date(transaction.createdAt).toLocaleDateString()}</p></div></div><p className={transaction.direction === 'CREDIT' ? 'text-sm font-bold text-emerald-300' : 'text-sm font-bold text-white'}>{transaction.direction === 'CREDIT' ? '+' : '-'}{money(transaction.amount,currency)}</p></div>)}</ActivityPanel><ActivityPanel title="Recent orders" href="/orders" empty="Your orders will appear after your first purchase.">{dashboard.recentOrders.map((order) => <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between gap-4 border-b border-emerald-100/[.07] py-3.5 last:border-0 hover:bg-white/[.015]"><div className="min-w-0"><p className="truncate text-sm font-bold">{order.product.name}</p><p className="mt-1 text-[11px] text-emerald-100/40">{new Date(order.createdAt).toLocaleDateString()}</p></div><div className="flex items-center gap-3"><p className="text-sm font-bold">{money(order.amount,order.currency||currency)}</p><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[.1em] ${statusTone(order.status)}`}>{order.status}</span></div></Link>)}</ActivityPanel></section>
      </> : null}
    </div>
  </div></main>;
}

function Metric({icon,label,value,action,href,tone}:{icon:ReactNode;label:string;value:string;action:string;href:string;tone:'green'|'gold'}) { return <article className="rounded-2xl border border-emerald-100/10 bg-[#061915] p-5 shadow-[0_16px_50px_rgba(0,0,0,.18)]"><span className={tone==='gold'?'flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#F8D56B]':'flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300'}>{icon}</span><p className="mt-5 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-100/40">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{value}</p><Link href={href} className={tone==='gold'?'mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#F8D56B]':'mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-300'}>{action}<ArrowRight size={14}/></Link></article> }
function DashboardProduct({product,onPurchase}:{product:Product;onPurchase:()=>void}) { const price=money(product.price,product.currency||'NGN');return <article className="group relative overflow-hidden rounded-2xl border border-emerald-100/10 bg-[linear-gradient(140deg,rgba(7,55,43,.82),rgba(3,25,21,.96))] p-5"><div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl"/><div className="relative flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/15 bg-emerald-300/10 text-emerald-300"><Boxes size={20}/></span><span className="rounded-lg bg-emerald-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-300">Available</span></div><p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#F8D56B]">{product.category.name}</p><Link href={`/products/${product.slug}`} className="relative mt-1 block truncate text-lg font-bold hover:text-[#F8D56B]">{product.name}</Link><p className="relative mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-emerald-100/50">{product.description||'View product details and delivery information.'}</p><div className="relative mt-5 flex items-center justify-between border-t border-emerald-100/[.08] pt-4"><p className="text-base font-black">{price}</p><button type="button" onClick={onPurchase} className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-[11px] font-black text-[#062C23] hover:bg-[#F8D56B]"><ShoppingBag size={14}/>Purchase</button></div></article> }
function ActivityPanel({title,href,empty,children}:{title:string;href:string;empty:string;children:ReactNode[]}) { return <section className="rounded-2xl border border-emerald-100/10 bg-[#061915] p-5 sm:p-6"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">{title}</h2><Link href={href} className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-[#F8D56B]">View all <ArrowRight size={14}/></Link></div><div className="mt-4">{children.length?children:<p className="py-8 text-center text-sm text-emerald-100/45">{empty}</p>}</div></section> }