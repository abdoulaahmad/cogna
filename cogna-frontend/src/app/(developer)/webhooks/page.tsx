'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { RefreshCw, Send, Webhook } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
type Delivery={id:string;eventId:string;eventType:string;statusCode:number|null;response:string|null;success:boolean;createdAt:string};

export default function WebhooksPage(){
  const [url,setUrl]=useState('');const [secret,setSecret]=useState('');const [deliveries,setDeliveries]=useState<Delivery[]>([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{setLoading(true);try{const [config,logs]=await Promise.all([api.get('/developer/webhooks'),api.get('/developer/webhooks/deliveries')]);if(config.data.success&&config.data.data){setUrl(config.data.data.url);setSecret(config.data.data.secret)}if(logs.data.success)setDeliveries(logs.data.data)}catch(e:unknown){setError(getErrorMessage(e,'Unable to load webhook configuration.'))}finally{setLoading(false)}},[]);
  useEffect(()=>{const t=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(t)},[load]);
  async function save(e:FormEvent){e.preventDefault();setSaving(true);setError(null);try{const r=await api.post('/developer/webhooks',{url,secret});if(!r.data.success)throw new Error(r.data.message)}catch(e:unknown){setError(getErrorMessage(e,'Unable to save webhook endpoint.'))}finally{setSaving(false)}}
  async function replay(id:string){try{const r=await api.post(`/developer/webhooks/deliveries/${id}/retry`);if(!r.data.success)throw new Error(r.data.message);await load()}catch(e:unknown){setError(getErrorMessage(e,'Unable to replay delivery.'))}}
  
  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/webhooks" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Developer Tools</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Stay in sync with Cogna events.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Configure one endpoint and inspect the real delivery history. Your signing secret is never displayed in delivery logs.
          </p>

          {error&&<p className="mt-6 text-sm text-rose-100 p-4 bg-rose-950/30 border border-rose-300/20 rounded-2xl">{error}</p>}
          
          <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.4fr]">
            <form onSubmit={save} className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark flex flex-col">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]">
                  <Webhook size={20}/>
                </span>
                <h2 className="font-display text-xl font-bold">Endpoint setup</h2>
              </div>
              <label className="mt-8 block text-xs font-bold text-emerald-100/70">
                Destination URL
                <input required type="url" value={url} onChange={e=>setUrl(e.target.value)} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors" placeholder="https://example.com/webhooks/cogna"/>
              </label>
              <label className="mt-5 block text-xs font-bold text-emerald-100/70">
                Signing secret
                <input required type="password" value={secret} onChange={e=>setSecret(e.target.value)} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
              </label>
              <button disabled={saving} className="mt-8 w-full sm:w-auto self-start rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors">
                {saving?'Saving…':'Save endpoint'}
              </button>
            </form>

            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-100/10">
                <h2 className="font-display text-xl font-bold">Delivery history</h2>
                <button onClick={()=>void load()} className="text-emerald-100/50 hover:text-[#F8D56B] transition-colors p-2 bg-black/20 rounded-full border border-emerald-100/5">
                  <RefreshCw className={loading?'animate-spin':''} size={16}/>
                </button>
              </div>
              <div className="mt-4 flex-1 flex flex-col divide-y divide-emerald-100/10">
                {deliveries.length ? deliveries.map(d=>
                  <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-2">
                    <div>
                      <p className="font-bold text-base">{d.eventType}</p>
                      <p className="mt-1 font-mono text-[10px] text-emerald-100/45 bg-black/20 px-2 py-1 rounded-md inline-block">
                        {d.eventId}
                      </p>
                      <p className="mt-2 text-xs text-emerald-100/65">
                        {new Date(d.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${d.success?'bg-emerald-400/10 text-emerald-300':'bg-rose-400/10 text-rose-300 border border-rose-400/20'}`}>
                        {d.statusCode||'FAILED'}
                      </span>
                      <button onClick={()=>void replay(d.id)} className="rounded-full bg-black/20 border border-emerald-100/15 p-2.5 text-[#F8D56B] hover:bg-[#D4AF37]/10 transition-colors" title="Replay Delivery">
                        <Send size={14}/>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-emerald-100/15 rounded-2xl mt-2">
                    <p className="text-sm text-emerald-100/60">No deliveries have been recorded yet.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}