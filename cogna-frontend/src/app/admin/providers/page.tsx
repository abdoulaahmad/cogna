'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { Plus, Trash2, Loader2, Settings, FolderClosed, Package } from 'lucide-react';

interface ProviderItem {
  id: string;
  name: string;
  baseUrl: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchProviders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/providers');
      if (response.data.success) {
        setProviders(response.data.data);
      } else {
        setError(response.data.message || 'Failed to retrieve providers.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch providers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseUrl.trim() || !apiKey.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const response = await api.post('/admin/providers', {
        name,
        baseUrl,
        apiKey,
        apiSecret: apiSecret || undefined,
        status: 'ACTIVE',
      });

      if (response.data.success) {
        setProviders([...providers, response.data.data]);
        setName('');
        setBaseUrl('');
        setApiKey('');
        setApiSecret('');
      } else {
        setError(response.data.message || 'Failed to create provider.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create provider. Server error.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Are you sure you want to delete this provider configuration? Products linked to this provider will fail to fulfill.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/providers/${id}`);
      if (response.data.success) {
        setProviders(providers.filter((p) => p.id !== id));
      } else {
        alert(response.data.message || 'Deletion failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete provider.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-display">
        
        {/* Admin Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-bold text-slate-500 pb-px">
          <Link href="/admin/products" className="hover:text-slate-800 pb-3 flex items-center gap-1.5">
            <Package size={14} /> Products Catalog
          </Link>
          <Link href="/admin/categories" className="hover:text-slate-800 pb-3 flex items-center gap-1.5">
            <FolderClosed size={14} /> Categories
          </Link>
          <Link href="/admin/providers" className="border-b-2 border-indigo-600 text-indigo-600 pb-3 flex items-center gap-1.5">
            <Settings size={14} /> Providers (resellers)
          </Link>
        </div>

        {/* Action Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Provider Form */}
          <div className="lg:col-span-4">
            <GlassCard className="p-5 border-slate-200/50 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add Fulfillment Provider</h3>
              
              <form onSubmit={handleCreateProvider} className="space-y-4">
                <Input
                  label="Provider Name"
                  placeholder="Akunding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                
                <Input
                  label="Base API URL"
                  placeholder="https://akunding.com/api"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  required
                />

                <Input
                  label="API Token Key"
                  type="password"
                  placeholder="••••••••"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />

                <Input
                  label="API Secret Key (Optional)"
                  type="password"
                  placeholder="••••••••"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                />

                <Button type="submit" isLoading={isCreating} className="w-full">
                  Save Provider Config
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Providers list */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Connected Reseller Gateways
            </h2>

            {error ? (
              <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-500 border border-rose-100">
                {error}
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Base URL</th>
                    <th className="px-6 py-4">API Token</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10">
                        <Loader2 className="animate-spin text-indigo-600 h-5 w-5 mx-auto" />
                      </td>
                    </tr>
                  ) : providers.length > 0 ? (
                    providers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate">{p.baseUrl}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">•••••••• (encrypted)</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteProvider(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete Provider"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 font-semibold">
                        No fulfillment providers configured. Add one on the left panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
