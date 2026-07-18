'use client';
import { FormEvent, useState } from 'react';
import { CheckCircle2, Terminal } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
type Product={id:string;name:string;price:number;currency:string};

export default function SandboxPage(){
  const [key,setKey]=useState('');const [products,setProducts]=useState<Product[]>([]);const [productId,setProductId]=useState('');const [email,setEmail]=useState('');const [output,setOutput]=useState('');const [error,setError]=useState<string|null>(null);const [loading,setLoading]=useState(false);
  async function init(){setLoading(true);setError(null);try{const r=await api.get('/sandbox/products',{headers:{'X-API-Key':key}});if(!r.data.success)throw new Error(r.data.message);setProducts(r.data.data);setProductId(r.data.data[0]?.id||'');setOutput(JSON.stringify(r.data,null,2))}catch(e:unknown){setError(getErrorMessage(e,'Sandbox catalog request failed.'))}finally{setLoading(false)}}
  async function order(e:FormEvent){e.preventDefault();setLoading(true);setError(null);try{const r=await api.post('/sandbox/orders',{productId,customerEmail:email},{headers:{'X-API-Key':key}});if(!r.data.success)throw new Error(r.data.message);setOutput(JSON.stringify(r.data,null,2))}catch(e:unknown){setError(getErrorMessage(e,'Sandbox order request failed.'))}finally{setLoading(false)}}
  
  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/sandbox" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">TEST sandbox</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Experiment without touching production.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Use a TEST key only. Sandbox orders are simulated and do not touch wallets, gateways, or live providers.
          </p>

          <section className="mt-8 rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark">
            <label className="text-xs font-bold text-emerald-100/70">
              TEST X-API-Key
              <input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="cg_test_…" className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
            </label>
            <button disabled={!key||loading} onClick={()=>void init()} className="mt-5 rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors">
              {loading?'Loading…':'Load sandbox catalog'}
            </button>
            {error&&<p className="mt-4 text-sm text-rose-100 p-4 bg-rose-950/30 border border-rose-300/20 rounded-2xl">{error}</p>}
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <form onSubmit={order} className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark">
              <h2 className="font-display text-xl font-bold">Simulate an order</h2>
              <label className="mt-6 block text-xs font-bold text-emerald-100/70">
                Product
                <select required disabled={!products.length} value={productId} onChange={e=>setProductId(e.target.value)} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors">
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.currency} {p.price})</option>)}
                </select>
              </label>
              <label className="mt-5 block text-xs font-bold text-emerald-100/70">
                Customer email
                <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
              </label>
              <button disabled={!products.length||loading} className="mt-6 w-full sm:w-auto rounded-full border border-emerald-100/20 px-6 py-3 text-sm font-bold text-emerald-100 hover:border-[#D4AF37] disabled:opacity-50 transition-colors">
                Run simulated order
              </button>
            </form>

            <section className="rounded-[2rem] border border-emerald-100/15 bg-black/40 p-6 lg:p-8 shadow-premium-dark flex flex-col">
              <div className="flex items-center gap-3 pb-4 border-b border-emerald-100/10">
                <Terminal className="text-[#F8D56B]" size={20}/>
                <h2 className="font-display text-xl font-bold">Response console</h2>
              </div>
              <div className="mt-4 flex-1 bg-black/50 rounded-2xl border border-emerald-100/5 p-4 overflow-hidden">
                <pre className="h-full overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-6 text-emerald-300/80">
                  {output||'Run a sandbox request to inspect the API response.'}
                </pre>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}