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
import CustomerPortalNav from '@/components/layout/customer-portal-nav';

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
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/support" variant="sidebar"/>
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#F8D56B]">Help desk</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Support Tickets</h1>
              <p className="mt-2 text-sm text-emerald-100/55">Open support records, ask questions, and link existing orders.</p>
            </div>
            <button
              onClick={() => void fetchTickets()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-emerald-100/10 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-white/10 hover:text-[#F8D56B]"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Reload tickets
            </button>
          </section>

          {success && (
            <div className="mt-8 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-6 text-sm font-bold text-emerald-300">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {error && (
            <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-950/25 p-6 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
            
            {/* List of active tickets (Takes 2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-display text-xl font-bold">My Support History</h3>

              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-emerald-100/10 bg-[#061915]">
                  <RefreshCw className="animate-spin text-[#F8D56B]" size={30} />
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => router.push(`/support/${t.id}`)}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-emerald-100/10 bg-[linear-gradient(140deg,rgba(7,55,43,.4),rgba(3,25,21,.6))] p-5 transition hover:border-[#F8D56B]/30 hover:bg-white/5"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="truncate text-sm font-bold text-white">{t.subject}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-100/50">
                          <Clock size={12} />
                          Updated {new Date(t.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-[10px] font-mono text-emerald-100/40 sm:block">{t.id.split('-')[0]}</span>
                        <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-[.1em] ${
                          t.status === 'OPEN'
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-amber-300/10 text-amber-200'
                            : 'bg-white/5 text-emerald-100/40'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-emerald-100/10 bg-[#061915] p-8 text-center">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100/10 bg-white/[0.02] text-emerald-100/20">
                        <MessageSquare size={24} />
                      </span>
                      <p className="mt-4 text-sm text-emerald-100/50">No support tickets found on your record.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ticket generation form */}
            <div className="rounded-2xl border border-emerald-100/10 bg-[#061915] p-6 shadow-[0_16px_50px_rgba(0,0,0,.18)]">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <PlusCircle size={18} className="text-[#F8D56B]" />
                File New Ticket
              </h3>

              <form onSubmit={handleCreateTicket} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Subject Heading</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Missing transaction"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-emerald-100/15 bg-black/20 p-3 text-sm text-white placeholder-emerald-100/20 transition focus:border-[#F8D56B] focus:outline-none focus:ring-1 focus:ring-[#F8D56B]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Order ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="UUID reference"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full rounded-xl border border-emerald-100/15 bg-black/20 p-3 font-mono text-sm text-white placeholder-emerald-100/20 transition focus:border-[#F8D56B] focus:outline-none focus:ring-1 focus:ring-[#F8D56B]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/50">Detailed Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none rounded-xl border border-emerald-100/15 bg-black/20 p-3 text-sm text-white placeholder-emerald-100/20 transition focus:border-[#F8D56B] focus:outline-none focus:ring-1 focus:ring-[#F8D56B]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-xs font-black text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="animate-spin" size={16} /> : <MessageSquare size={16} />}
                  {creating ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#020E0C] lg:pl-64 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-[#F8D56B]" size={32} />
        <span className="text-xs font-semibold text-emerald-100/50">Loading help desk...</span>
      </main>
    }>
      <SupportPageContent />
    </Suspense>
  );
}
