'use client';

import React, { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  ArrowLeft,
  Send,
  RefreshCw,
  AlertTriangle,
  User,
  ShieldAlert,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Message {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  orderId: string | null;
  createdAt: string;
  messages: Message[];
}

export default function TicketDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user, isAuthenticated } = useAuthStore();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Send message state
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchTicketDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/customer/support/tickets/${id}`);
      if (res.data.success) {
        setTicket(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch ticket info');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Connection failure'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { if (isAuthenticated && id) void fetchTicketDetail() }, 0)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, id]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/customer/support/tickets/${id}/messages`, { message: replyText });
      if (res.data.success) {
        setReplyText('');
        // Re-fetch to load new message
        const updateRes = await api.get(`/customer/support/tickets/${id}`);
        if (updateRes.data.success) {
          setTicket(updateRes.data.data);
        }
      } else {
        alert(res.data.message || 'Failed to send reply');
      }
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Error disaptching reply message'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
        <span className="text-xs font-semibold text-slate-400">Loading support conversation...</span>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-3xl mx-auto p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle size={18} />
            Ticket Unrecognized
          </div>
          <p className="text-xs mt-1">{error || 'Ticket not found'}</p>
          <button
            onClick={() => router.push('/support')}
            className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition"
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-display flex flex-col h-screen">
      
      {/* Header bar */}
      <header className="h-16 px-8 border-b border-emerald-950/40 bg-slate-950/90 flex items-center justify-between sticky top-0 z-50 backdrop-blur shrink-0">
        <button
          onClick={() => router.push('/support')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft size={16} />
          Back to Help Desk
        </button>

        <span className="text-xs font-bold tracking-widest text-emerald-400">CONVERSATION VIEW</span>
      </header>

      {/* Ticket Context Header info */}
      <div className="bg-slate-900/20 border-b border-slate-900 px-8 py-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-200">{ticket.subject}</h2>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Ticket ID: <span className="font-mono text-slate-400">{ticket.id}</span>
            {ticket.orderId && (
              <>
                <span className="mx-2">•</span>
                Linked Order: <Link href={`/orders/${ticket.orderId}`} className="text-emerald-400 hover:underline">{ticket.orderId.slice(0, 8)}</Link>
              </>
            )}
          </div>
        </div>
        <div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            ticket.status === 'OPEN'
              ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
              : ticket.status === 'IN_PROGRESS'
              ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}>
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Chat messages feed */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-950">
        {ticket.messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[70%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className="shrink-0 mt-1">
                <span className={`p-1.5 rounded-lg block ${isMe ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {isMe ? <User size={14} /> : <ShieldAlert size={14} />}
                </span>
              </div>
              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-emerald-950/30 border border-emerald-900/30 text-slate-100 rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}>
                  {msg.message}
                </div>
                <div className={`text-[8px] text-slate-500 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                  <Clock size={8} />
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Text input footer dispatch console */}
      {ticket.status !== 'CLOSED' ? (
        <form onSubmit={handleSendReply} className="p-4 border-t border-slate-900 bg-slate-900/20 shrink-0 flex gap-3">
          <input
            type="text"
            placeholder="Type your message here..."
            required
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-4 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-xl flex items-center gap-2 transition disabled:opacity-50 text-slate-100"
          >
            <Send size={12} />
            <span>Send</span>
          </button>
        </form>
      ) : (
        <div className="p-4 border-t border-slate-900 bg-slate-900/10 text-center text-xs text-slate-500 shrink-0">
          This support ticket has been closed. No further replies can be sent.
        </div>
      )}

    </div>
  );
}
