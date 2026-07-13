'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { Plus, Trash2, Loader2, Settings, FolderClosed, Package } from 'lucide-react';
import type { Category } from '@/components/product/category-selector';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/categories');
      if (response.data.success) {
        setCategories(response.data.data);
      } else {
        setError(response.data.message || 'Failed to retrieve categories.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setIsCreating(true);
    setError(null);

    try {
      const response = await api.post('/admin/categories', {
        name,
        slug,
        description: description || undefined,
      });

      if (response.data.success) {
        setCategories([...categories, response.data.data]);
        setName('');
        setSlug('');
        setDescription('');
      } else {
        setError(response.data.message || 'Failed to create category.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create category. Server error.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Any associated products must be reassigned first.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/categories/${id}`);
      if (response.data.success) {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        alert(response.data.message || 'Deletion failed.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete category.');
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
          <Link href="/admin/categories" className="border-b-2 border-indigo-600 text-indigo-600 pb-3 flex items-center gap-1.5">
            <FolderClosed size={14} /> Categories
          </Link>
          <Link href="/admin/providers" className="hover:text-slate-800 pb-3 flex items-center gap-1.5">
            <Settings size={14} /> Providers (resellers)
          </Link>
        </div>

        {/* Action Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Create Category Form */}
          <div className="lg:col-span-4">
            <GlassCard className="p-5 border-slate-200/50 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Add New Category</h3>
              
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <Input
                  label="Category Name"
                  placeholder="Natural Language"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                
                <Input
                  label="URL Slug"
                  placeholder="natural-language"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />

                <Input
                  label="Description"
                  placeholder="Text & NLP models..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Button type="submit" isLoading={isCreating} className="w-full">
                  Create Category
                </Button>
              </form>
            </GlassCard>
          </div>

          {/* Categories list */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
              Existing Product Categories
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
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Description</th>
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
                  ) : categories.length > 0 ? (
                    categories.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                        <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{c.slug}</td>
                        <td className="px-6 py-4 max-w-[200px] truncate">{c.description || 'N/A'}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteCategory(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Delete Category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 font-semibold">
                        No categories created yet. Add one on the left panel.
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
