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
      const trimmedSubject = subject.trim();
      const trimmedMessage = message.trim();
      const trimmedOrderId = orderId.trim();

      if (trimmedSubject.length < 2 || trimmedMessage.length < 2) {
        setError('Subject and message must be at least 2 characters long.');
        setCreating(false);
        return;
      }

      const payload: { subject: string; message: string; orderId?: string } = { subject: trimmedSubject, message: trimmedMessage };
      
      if (trimmedOrderId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(trimmedOrderId)) {
          setError('Order ID must be a valid UUID (e.g. 123e4567-e89b-12d3-a456-426614174000). You can also leave it blank.');
          setCreating(false);
          return;
        }
        payload.orderId = trimmedOrderId;
      }

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
                    minLength={2}
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
                    minLength={2}
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

            {/* Other Support Channels */}
            <div className="rounded-2xl border border-emerald-100/10 bg-[#061915] p-6 shadow-[0_16px_50px_rgba(0,0,0,.18)] mt-8">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <HelpCircle size={18} className="text-[#F8D56B]" />
                Community & Socials
              </h3>
              <p className="mt-3 text-sm text-emerald-100/60">Connect with us on other platforms for quicker updates and community support.</p>
              
              <div className="mt-5 space-y-3">
                <a
                  href="https://t.me/cogna_store"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-100/10 bg-black/20 p-3 transition hover:border-[#18B88A]/50 hover:bg-[#18B88A]/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B88A]/10 text-[#18B88A]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.21-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">Telegram Group</p>
                    <p className="text-xs text-emerald-100/50">t.me/cogna_store</p>
                  </div>
                </a>

                <a
                  href="https://whatsapp.com/channel/0029Vb8KsKx0rGiIUNNJyn2E"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-emerald-100/10 bg-black/20 p-3 transition hover:border-[#18B88A]/50 hover:bg-[#18B88A]/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#18B88A]/10 text-[#18B88A]">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">WhatsApp Channel</p>
                    <p className="text-xs text-emerald-100/50">Follow for updates</p>
                  </div>
                </a>
              </div>
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
