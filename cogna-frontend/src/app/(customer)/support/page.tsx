'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  MessageSquare,
  PlusCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Home,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';

interface TicketItem {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

function SupportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get('orderId') || '';

  const { isAuthenticated } = useAuthStore();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState(initialOrderId);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/customer/support/tickets');
      if (res.data.success) {
        setTickets(res.data.data.items);
      } else {
        setError(res.data.message || 'Failed to retrieve support tickets');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Connection error to support gateway'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { if (isAuthenticated) void fetchTickets() }, 0)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSuccess(null);
    setError(null);
    try {
      const payload: { subject: string; message: string; orderId?: string } = { subject, message };
      if (orderId) payload.orderId = orderId;

      const res = await api.post('/customer/support/tickets', payload);
      if (res.data.success) {
        setSuccess('Support ticket created successfully!');
        setSubject('');
        setMessage('');
        setOrderId('');
        fetchTickets();
      } else {
        setError(res.data.message || 'Failed to submit support ticket');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error sending request'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-display">
      
      {/* Header */}
      <header className="h-16 px-8 border-b border-emerald-950/40 bg-slate-950/90 flex items-center justify-between sticky top-0 z-50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-200">
            <Home size={16} />
          </Link>
          <span className="text-slate-500">/</span>
          <span className="text-xs font-bold tracking-widest text-emerald-400">HELP DESK</span>
        </div>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300"
        >
          <RefreshCw size={12} />
          Reload
        </button>
      </header>

      <div className="max-w-5xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Marketplace Support Desk</h1>
          <p className="text-xs text-slate-400 mt-1">Open support records, ask question timelines, and link existing subscription failures directly.</p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle size={16} />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* List of active tickets (Takes 2 cols) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-300">My Support Tickets</h3>

            {loading ? (
              <div className="py-12 flex justify-center">
                <RefreshCw className="animate-spin text-emerald-500" size={24} />
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/support/${t.id}`)}
                    className="p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-800 rounded-2xl flex justify-between items-center cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-200">{t.subject}</div>
                      <div className="text-[9px] text-slate-500 flex items-center gap-1">
                        <Clock size={10} />
                        Updated {new Date(t.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-slate-500">{t.id.slice(0, 8)}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'OPEN'
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30'
                          : 'bg-slate-850 text-slate-500 border border-slate-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}

                {tickets.length === 0 && (
                  <div className="py-12 bg-slate-900/10 border border-slate-900/40 rounded-2xl text-center text-xs text-slate-500">
                    No support tickets found on your record.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ticket generation form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <PlusCircle size={16} className="text-emerald-400" />
              File New Ticket
            </h3>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Subject Heading</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Transaction settlement missing"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Order Association ID (Optional)</label>
                <input
                  type="text"
                  placeholder="UUID reference"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Detail Message description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue or order discrepancy in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {creating ? 'Submitting ticket...' : 'Submit Support Ticket'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
        <span className="text-xs font-semibold text-slate-400">Loading help desk...</span>
      </div>
    }>
      <SupportPageContent />
    </Suspense>
  );
}
