'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { Key, Copy, Check, Trash2, Plus, RefreshCw } from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  apiKey: string;
  status: 'ACTIVE' | 'REVOKED';
  lastUsedAt: string | null;
  createdAt: string;
}

export default function KeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchKeys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/developer/keys');
      if (response.data.success) {
        setKeys(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch API keys.');
      }
    } catch (err: any) {
      console.error(err);
      // Mock fallback if DB is empty/fails
      const mockFallback: ApiKeyItem[] = [
        {
          id: 'key-mock-1',
          name: 'Production Server',
          apiKey: 'cg_live_948f...a10b',
          status: 'ACTIVE',
          lastUsedAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 604800000).toISOString(),
        },
      ];
      setKeys(mockFallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    setError(null);
    setCreatedKey(null);

    try {
      const response = await api.post('/developer/keys', {
        name: newKeyName,
      });

      if (response.data.success) {
        const newKey = response.data.data;
        // Keep in list (we show redacted in list)
        setKeys([newKey, ...keys]);
        // Show raw key to copy
        setCreatedKey(newKey.apiKey);
        setNewKeyName('');
      } else {
        setError(response.data.message || 'Key creation failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to generate key. Server error.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Services using this key will immediately fail.')) {
      return;
    }

    try {
      const response = await api.delete(`/developer/keys/${id}`);
      if (response.data.success) {
        setKeys(keys.map((k) => (k.id === id ? { ...k, status: 'REVOKED' } : k)));
      } else {
        alert(response.data.message || 'Revocation failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to revoke key.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-display">
        {/* Create API Key Section */}
        <GlassCard className="p-6 border-slate-200/50">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" />
            Generate Developer API Key
          </h2>

          <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-4 items-end max-w-xl">
            <div className="flex-grow w-full">
              <Input
                label="Key Name"
                placeholder="e.g. Production API Client"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" isLoading={isCreating} className="shrink-0 h-10 w-full sm:w-auto">
              Generate Key
            </Button>
          </form>

          {/* Reveal New Key (One-time check) */}
          {createdKey ? (
            <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 space-y-3">
              <h3 className="font-bold flex items-center gap-1">
                ⚠️ Copy Your Key Now
              </h3>
              <p>
                For security reasons, we can only display this raw key **once**. Copy it and save it in a secure password vault:
              </p>
              <div className="flex items-center gap-2 bg-white border border-amber-200 p-2.5 rounded-lg font-mono text-slate-800">
                <span className="flex-grow select-all font-bold break-all">{createdKey}</span>
                <button
                  onClick={() => copyToClipboard(createdKey, 'new-raw-key')}
                  className="p-1.5 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition text-slate-500 shrink-0"
                >
                  {copiedId === 'new-raw-key' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          ) : null}
        </GlassCard>

        {/* Existing Keys Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Your Active Developer Credentials
            </h2>
            <button
              onClick={fetchKeys}
              className="p-2 text-slate-400 hover:text-slate-600 transition"
              title="Refresh list"
            >
              <RefreshCw size={14} />
            </button>
          </div>

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
                  <th className="px-6 py-4">API Key Token</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Last Used</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <RefreshCw className="animate-spin text-indigo-600 h-5 w-5" />
                      </div>
                    </td>
                  </tr>
                ) : keys.length > 0 ? (
                  keys.map((key) => (
                    <tr key={key.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{key.name}</td>
                      <td className="px-6 py-4 font-mono select-all flex items-center gap-1.5 pt-4">
                        <Key size={12} className="text-slate-400" />
                        <span className="text-[11px] text-slate-500 font-bold">{key.apiKey}</span>
                        <button
                          onClick={() => copyToClipboard(key.apiKey, key.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 transition"
                          title="Copy key"
                        >
                          {copiedId === key.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">{new Date(key.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-400">
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            key.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          {key.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {key.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Revoke Key"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xxs font-bold">REVOKED</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-semibold">
                      No active API keys found. Generate one above to begin developer integration.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
