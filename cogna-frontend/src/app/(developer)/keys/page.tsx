'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { getErrorMessage } from '@/lib/error-message';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
type KeyItem = { id:string; name:string; apiKey:string; environment:'TEST'|'LIVE'; scopes:string[]; expiresAt:string|null; status:'ACTIVE'|'REVOKED' };
const scopes = ['read:catalog','write:orders','read:orders'];

export default function KeysPage() {
  const [keys,setKeys]=useState<KeyItem[]>([]); const [name,setName]=useState(''); const [environment,setEnvironment]=useState<'TEST'|'LIVE'>('TEST'); const [selected,setSelected]=useState<string[]>(['read:catalog']); const [raw,setRaw]=useState<string|null>(null); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{setLoading(true);setError(null);try{const r=await api.get('/developer/keys');if(!r.data.success)throw new Error(r.data.message);setKeys(r.data.data)}catch(e:unknown){setError(getErrorMessage(e,'Unable to load API keys.'))}finally{setLoading(false)}},[]);
  useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
  async function create(e:FormEvent){e.preventDefault();setCreating(true);try{const r=await api.post('/developer/keys',{name,environment,scopes:selected});if(!r.data.success)throw new Error(r.data.message);setRaw(r.data.data.rawKey);setName('');await load()}catch(e:unknown){setError(getErrorMessage(e,'Unable to create API key.'))}finally{setCreating(false)}}
  async function revoke(id:string){if(!confirm('Revoke this key? Integrations using it will stop working.'))return;try{const r=await api.delete(`/developer/keys/${id}`);if(!r.data.success)throw new Error(r.data.message);await load()}catch(e:unknown){setError(getErrorMessage(e,'Unable to revoke API key.'))}}
  
  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/keys" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Developer Tools</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Scoped access, under your control.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Create, manage, and revoke API keys for programmatic access to the Cogna platform.
          </p>

          {error ? <p className="mt-6 rounded-2xl border border-rose-300/25 bg-rose-950/30 p-4 text-sm text-rose-100">{error}</p> : null}
          
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <form onSubmit={create} className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark flex flex-col">
              <h2 className="flex items-center gap-3 font-display text-xl font-bold">
                <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]">
                  <KeyRound size={20} />
                </span>
                Create an API key
              </h2>
              
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="text-xs font-bold text-emerald-100/70">
                  Key name
                  <input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"/>
                </label>
                <label className="text-xs font-bold text-emerald-100/70">
                  Environment
                  <select value={environment} onChange={e=>setEnvironment(e.target.value as 'TEST'|'LIVE')} className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors">
                    <option value="TEST">TEST</option>
                    <option value="LIVE">LIVE</option>
                  </select>
                </label>
              </div>
              
              <div className="mt-5 flex flex-wrap gap-3">
                {scopes.map(scope=>
                  <label key={scope} className="rounded-full border border-emerald-100/15 px-4 py-2 text-xs font-bold text-emerald-100/75 cursor-pointer hover:border-[#D4AF37] transition-colors">
                    <input className="mr-2 accent-[#D4AF37]" type="checkbox" checked={selected.includes(scope)} onChange={()=>setSelected(v=>v.includes(scope)?v.filter(x=>x!==scope):[...v,scope])}/>
                    {scope}
                  </label>
                )}
              </div>
              
              <button disabled={creating||selected.length===0} className="mt-6 w-full sm:w-auto self-start rounded-full bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors">
                {creating?'Creating…':'Create API key'}
              </button>
              
              {raw ? (
                <div className="mt-6 rounded-2xl border border-amber-200/30 bg-amber-950/25 p-5">
                  <p className="font-bold text-amber-100 text-sm">Copy this key now. It will not be shown again.</p>
                  <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-black/25 p-4 font-mono text-xs">
                    <span className="flex-1 break-all text-amber-50">{raw}</span>
                    <button type="button" onClick={()=>void navigator.clipboard.writeText(raw)} className="text-amber-200 hover:text-amber-100 transition-colors bg-amber-900/30 p-2 rounded-lg">
                      <Copy size={16}/>
                    </button>
                  </div>
                </div>
              ) : null}
            </form>

            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 lg:p-8 shadow-premium-dark flex flex-col">
              <h2 className="font-display text-xl font-bold">Your keys</h2>
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[#F8D56B] h-8 w-8"/>
                </div>
              ) : (
                <div className="mt-5 divide-y divide-emerald-100/10 flex-1 flex flex-col">
                  {keys.length===0 ? (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-emerald-100/15 rounded-2xl mt-2">
                      <p className="text-sm text-emerald-100/60">No keys have been created yet.</p>
                    </div>
                  ) : keys.map(key=>(
                    <div key={key.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
                      <div>
                        <p className="font-bold text-base">{key.name}</p>
                        <p className="mt-1 font-mono text-xs text-emerald-100/50">{key.apiKey}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${key.environment === 'LIVE' ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
                            {key.environment}
                          </span>
                          <span className="text-xs text-emerald-100/65">
                            · {key.scopes.join(', ')} · {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'No expiry'}
                          </span>
                        </div>
                      </div>
                      {key.status==='ACTIVE' ? (
                        <button type="button" onClick={()=>void revoke(key.id)} className="rounded-full border border-rose-200/30 p-2.5 text-rose-300 hover:bg-rose-500/10 hover:border-rose-300 transition-colors" title="Revoke API key">
                          <Trash2 size={16}/>
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-100/45 px-3 py-1 bg-black/20 rounded-full border border-emerald-100/5">REVOKED</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}