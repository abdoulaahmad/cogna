'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import type { Product } from '@/components/product/product-card'
import type { Category } from '@/components/product/category-selector'
import { Boxes, Edit, Loader2, Package, PackageSearch, Plus, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react'
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, AdminPanel, AdminSearch, CatalogTabs, fieldClass, primaryButton } from '@/components/admin/admin-ui'

type Provider={id:string;name:string;baseUrl:string;status:'ACTIVE'|'INACTIVE'}
type Form={name:string;slug:string;description:string;price:string;currency:string;providerId:string;providerProductId:string;categoryId:string;paymentGateway:'PAYSTACK'|'MONNIFY';deliveryTime:string;image:string}
const empty:Form={name:'',slug:'',description:'',price:'',currency:'NGN',providerId:'',providerProductId:'',categoryId:'',paymentGateway:'PAYSTACK',deliveryTime:'Instant',image:''}

export default function AdminProductsPage(){
  const[products,setProducts]=React.useState<Product[]>([]);const[categories,setCategories]=React.useState<Category[]>([]);const[providers,setProviders]=React.useState<Provider[]>([]);const[loading,setLoading]=React.useState(true);const[error,setError]=React.useState<string|null>(null);const[open,setOpen]=React.useState(false);const[creating,setCreating]=React.useState(false);const[search,setSearch]=React.useState('');const[form,setForm]=React.useState<Form>(empty);const[editId,setEditId]=React.useState<string|null>(null);
  
  const load=React.useCallback(async()=>{setLoading(true);setError(null);try{const[p,c,v]=await Promise.all([api.get('/admin/products'),api.get('/admin/categories'),api.get('/admin/providers')]);setProducts(p.data.data.items||[]);setCategories(c.data.data||[]);setProviders(v.data.data||[])}catch(e:unknown){setError(getErrorMessage(e,'Unable to load catalog administration data.'))}finally{setLoading(false)}},[]);
  React.useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load])
  
  const visible=React.useMemo(()=>{const term=search.toLowerCase().trim();return term?products.filter(p=>[p.name,p.slug,p.category?.name||'',p.paymentGateway].some(value=>value.toLowerCase().includes(term))):products},[products,search])
  
  function update<K extends keyof Form>(key:K,value:Form[K]){setForm(current=>({...current,[key]:value}))}
  
  async function submitForm(e:React.FormEvent){
    e.preventDefault();setCreating(true);setError(null);
    try{
      const payload = { ...form, price: Number(form.price), image: form.image || undefined }; 
      if (editId) {
        const r=await api.patch(`/admin/products/${editId}`, payload);
        setProducts(list=>list.map(p=>p.id===editId ? {...p, ...r.data.data, category: categories.find(c=>c.id===payload.categoryId) || p.category} : p));
      } else {
        const r=await api.post('/admin/products', payload);
        const newProduct = {...r.data.data, category: categories.find(c=>c.id===payload.categoryId) || {name: 'Unknown', id: payload.categoryId}};
        setProducts(list=>[newProduct,...list]);
      }
      setForm(empty);setEditId(null);setOpen(false);
    }catch(err:unknown){
      setError(getErrorMessage(err, editId ? 'Unable to update product.' : 'Unable to create product.'))
    }finally{
      setCreating(false);
    }
  }

  async function toggle(id:string,active:boolean){try{await api.patch(`/admin/products/${id}`,{active:!active});setProducts(list=>list.map(p=>p.id===id?{...p,active:!active}:p))}catch(err:unknown){setError(getErrorMessage(err,'Unable to update product availability.'))}}
  
  async function remove(id:string){
    if(!window.confirm('Are you sure you want to delete this product?')) return;
    try{
      await api.delete(`/admin/products/${id}`);
      setProducts(list=>list.filter(p=>p.id!==id));
    }catch(err:unknown){
      setError(getErrorMessage(err,'Unable to delete product.'))
    }
  }

  function edit(p:Product & {providerId?:string, providerProductId?:string}) {
    // Note: Some backend models don't return providerId natively on the GET /products response unless it's admin detailed view.
    // Assuming the API returns enough fields to repopulate the form, or we just do our best.
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      price: String(p.price),
      currency: p.currency || 'NGN',
      categoryId: p.category?.id || '',
      providerId: p.providerId || '',
      providerProductId: p.providerProductId || '',
      paymentGateway: p.paymentGateway || 'PAYSTACK',
      deliveryTime: p.deliveryTime || '',
      image: p.image || ''
    });
    setEditId(p.id);
    setOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAdd() {
    setForm(empty);
    setEditId(null);
    setOpen(value=>!value);
  }

  const money=(p:Product)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:p.currency||'NGN'}).format(Number(p.price))
  
  return (
    <div className="space-y-8 p-5 sm:p-8 xl:p-10">
      <AdminPageHeader eyebrow="Catalog operations" title="Products" description="Manage the real products customers can buy, their fulfillment mappings, prices, categories, and payment gateways." action={<button onClick={handleAdd} className={primaryButton}>{open?<X size={15}/>:<Plus size={15}/>} {open?'Close form':'Add product'}</button>}/>
      <CatalogTabs current="/admin/products"/>
      {error&&<AdminError message={error}/>} 
      {open&&<AdminPanel className="p-6 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#F8D56B]"><Package size={18}/></span>
          <div>
            <h2 className="font-bold text-white">{editId ? 'Edit product' : 'New marketplace product'}</h2>
            <p className="mt-1 text-xs text-emerald-100/40">Every product must map to an existing category and fulfillment provider.</p>
          </div>
        </div>
        <form onSubmit={submitForm} className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="text-xs font-bold text-emerald-100/60">Product name<input required value={form.name} onChange={e=>{update('name',e.target.value);if(!form.slug && !editId)update('slug',e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''))}} className={fieldClass} placeholder="ChatGPT Plus"/></label>
          <label className="text-xs font-bold text-emerald-100/60">URL slug<input required value={form.slug} onChange={e=>update('slug',e.target.value)} className={fieldClass} placeholder="chatgpt-plus"/></label>
          <label className="text-xs font-bold text-emerald-100/60">Provider product ID<input required value={form.providerProductId} onChange={e=>update('providerProductId',e.target.value)} className={fieldClass} placeholder="Provider catalog ID"/></label>
          <label className="text-xs font-bold text-emerald-100/60">Price<input required min="0" step="0.01" type="number" value={form.price} onChange={e=>update('price',e.target.value)} className={fieldClass} placeholder="5000"/></label>
          <label className="text-xs font-bold text-emerald-100/60">Currency<input required value={form.currency} onChange={e=>update('currency',e.target.value.toUpperCase())} className={fieldClass} maxLength={3}/></label>
          <label className="text-xs font-bold text-emerald-100/60">Delivery time<input value={form.deliveryTime} onChange={e=>update('deliveryTime',e.target.value)} className={fieldClass}/></label>
          <label className="text-xs font-bold text-emerald-100/60">Category<select required value={form.categoryId} onChange={e=>update('categoryId',e.target.value)} className={fieldClass}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-xs font-bold text-emerald-100/60">Fulfillment provider<select required value={form.providerId} onChange={e=>update('providerId',e.target.value)} className={fieldClass}><option value="">Select provider</option>{providers.filter(p=>p.status==='ACTIVE').map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label className="text-xs font-bold text-emerald-100/60">Payment gateway<select value={form.paymentGateway} onChange={e=>update('paymentGateway',e.target.value as Form['paymentGateway'])} className={fieldClass}><option value="PAYSTACK">Paystack</option><option value="MONNIFY">Monnify</option></select></label>
          <label className="text-xs font-bold text-emerald-100/60 md:col-span-2 xl:col-span-3">Image URL (Optional)<input type="url" value={form.image} onChange={e=>update('image',e.target.value)} className={fieldClass} placeholder="https://example.com/image.png"/></label>
          <label className="text-xs font-bold text-emerald-100/60 md:col-span-2 xl:col-span-3">Description<textarea value={form.description} onChange={e=>update('description',e.target.value)} className={`${fieldClass} min-h-24 resize-y`} placeholder="What the customer receives"/></label>
          <div className="md:col-span-2 xl:col-span-3">
            <button disabled={creating||!categories.length||!providers.some(p=>p.status==='ACTIVE')} className={primaryButton}>{creating?<Loader2 className="animate-spin" size={15}/>:<Plus size={15}/>}{editId ? 'Save changes' : 'Create product'}</button>
            {editId && <button type="button" onClick={() => { setForm(empty); setEditId(null); setOpen(false); }} className="ml-3 rounded-full px-4 py-2.5 text-xs font-bold text-emerald-100/60 hover:text-white">Cancel</button>}
          </div>
        </form>
      </AdminPanel>}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><AdminSearch value={search} onChange={setSearch} placeholder="Search product, category, or gateway"/><p className="text-xs text-emerald-100/38">{visible.length} products</p></div>
      <AdminPanel className="overflow-hidden">
        {loading?<AdminLoading label="Loading products…"/>:!visible.length?<AdminEmpty icon={PackageSearch} title="No matching products" description="Create a product after categories and providers are configured."/>:
        <div className="grid gap-px bg-emerald-100/[.07] md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((p: any)=><article key={p.id} className="bg-[#071c17] p-5 relative group">
            <div className="flex items-start justify-between gap-4">
              {p.image ? <img src={p.image} alt={p.name} className="h-11 w-11 rounded-2xl object-cover border border-emerald-100/10" /> : <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#D4AF37]/10 text-[#F8D56B]"><Boxes size={19}/></span>}
              <div className="flex items-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mr-2 bg-black/40 rounded-full p-1 border border-white/5">
                  <button onClick={()=>edit(p)} className="p-1.5 text-emerald-100/50 hover:text-[#F8D56B] rounded-full hover:bg-white/5" title="Edit Product"><Edit size={13}/></button>
                  <button onClick={()=>void remove(p.id)} className="p-1.5 text-emerald-100/50 hover:text-rose-400 rounded-full hover:bg-white/5" title="Delete Product"><Trash2 size={13}/></button>
                </div>
                <button onClick={()=>void toggle(p.id,p.active!==false)} className={p.active!==false?'flex items-center gap-1.5 text-[10px] font-black text-emerald-300':'flex items-center gap-1.5 text-[10px] font-black text-amber-200'}>{p.active!==false?<ToggleRight size={20}/>:<ToggleLeft size={20}/>} {p.active!==false?'ACTIVE':'INACTIVE'}</button>
              </div>
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[#D4AF37]">{p.category?.name||'Uncategorized'}</p>
            <h2 className="mt-2 text-lg font-black text-white">{p.name}</h2>
            <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-emerald-100/42">{p.description||'No product description.'}</p>
            <div className="mt-5 flex items-end justify-between border-t border-emerald-100/10 pt-4">
              <div><p className="text-lg font-black text-white">{money(p)}</p><p className="mt-1 text-[10px] text-emerald-100/35">{p.deliveryTime||'Delivery time unavailable'}</p></div>
              <span className="rounded-full border border-emerald-100/10 px-2.5 py-1 text-[9px] font-bold text-emerald-100/45">{p.paymentGateway}</span>
            </div>
          </article>)}
        </div>}
      </AdminPanel>
    </div>
  )
}