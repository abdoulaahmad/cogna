'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { Plus, Edit2, ToggleLeft, ToggleRight, Loader2, Settings, FolderClosed, Package } from 'lucide-react';
import type { Product } from '@/components/product/product-card';
import type { Category } from '@/components/product/category-selector';

interface ProviderItem {
  id: string;
  name: string;
  baseUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'NGN',
    providerId: '',
    providerProductId: '',
    categoryId: '',
    paymentGateway: 'PAYSTACK' as 'PAYSTACK' | 'MONNIFY',
    deliveryTime: 'Instant',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, provRes] = await Promise.all([
        api.get('/admin/products'),
        api.get('/admin/categories'),
        api.get('/admin/providers'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data.items || []);
      if (catRes.data.success) setCategories(catRes.data.data || []);
      if (provRes.data.success) setProviders(provRes.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch administration data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      const response = await api.patch(`/admin/products/${id}`, {
        active: !active,
      });
      if (response.data.success) {
        setProducts(products.map((p) => (p.id === id ? { ...p, active: !active } : p)));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle product status.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
      };

      const response = await api.post('/admin/products', payload);
      
      if (response.data.success) {
        setProducts([response.data.data, ...products]);
        setIsFormOpen(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          price: '',
          currency: 'NGN',
          providerId: '',
          providerProductId: '',
          categoryId: '',
          paymentGateway: 'PAYSTACK',
          deliveryTime: 'Instant',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create product.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-display">
        
        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500 pb-px">
          <Link href="/admin/products" className="border-b-2 border-indigo-600 text-indigo-600 pb-3 flex items-center gap-1.5">
            <Package size={14} /> Products Catalog
          </Link>
          <Link href="/admin/categories" className="hover:text-slate-800 pb-3 flex items-center gap-1.5">
            <FolderClosed size={14} /> Categories
          </Link>
          <Link href="/admin/providers" className="hover:text-slate-800 pb-3 flex items-center gap-1.5">
            <Settings size={14} /> Providers (resellers)
          </Link>
        </div>

        {/* Action Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            Manage Products
          </h2>
          <Button onClick={() => setIsFormOpen(!isFormOpen)} className="flex items-center gap-1">
            <Plus size={14} /> Add Product
          </Button>
        </div>

        {error ? (
          <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-500 border border-rose-100">
            {error}
          </div>
        ) : null}

        {/* Inline Create Form Modal */}
        {isFormOpen ? (
          <GlassCard className="p-6 border-slate-200/50 max-w-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Add New Subscription Product</h3>
            <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                placeholder="ChatGPT Plus"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="URL Slug"
                placeholder="chatgpt-plus"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Description"
                  placeholder="Subscription to GPT-4 chat interface..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Input
                label="Price"
                type="number"
                placeholder="5000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Payment Gateway</label>
                <select
                  value={formData.paymentGateway}
                  onChange={(e: any) => setFormData({ ...formData, paymentGateway: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none"
                >
                  <option value="PAYSTACK">Paystack</option>
                  <option value="MONNIFY">Monnify</option>
                </select>
              </div>

              {/* Category Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Provider Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Fulfillment Provider</label>
                <select
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none"
                  required
                >
                  <option value="">Select Reseller Provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Provider Product Ref ID"
                placeholder="api-prod-code-123"
                value={formData.providerProductId}
                onChange={(e) => setFormData({ ...formData, providerProductId: e.target.value })}
                required
              />

              <Input
                label="Delivery Speed"
                placeholder="Instant"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              />

              <div className="sm:col-span-2 pt-4 flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Product
                </Button>
              </div>
            </form>
          </GlassCard>
        ) : null}

        {/* Products Table list */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Gateway</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Slug</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Toggle Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 className="animate-spin text-indigo-600 h-5 w-5 mx-auto" />
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
                        {p.paymentGateway}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: p.currency || 'NGN', minimumFractionDigits: 0 }).format(parseFloat(p.price))}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{p.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        p.active !== false
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {p.active !== false ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(p.id, p.active !== false)}
                        className={`p-1 rounded transition-colors ${
                          p.active !== false ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-400 hover:text-slate-500'
                        }`}
                        title={p.active !== false ? 'Deactivate Product' : 'Activate Product'}
                      >
                        {p.active !== false ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                    No products added to catalog yet. Use the button above to add your first product.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </DashboardLayout>
  );
}
