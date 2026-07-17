'use client';

import React, { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import {
  Bell,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Mail,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/customer/notifications');
      if (res.data.success) {
        setNotifications(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch notifications');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Connection failure'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { if (isAuthenticated) void fetchNotifications() }, 0)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await api.post(`/customer/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err);
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
          <span className="text-xs font-bold tracking-widest text-emerald-400">ALERT FEED</span>
        </div>
        <button
          onClick={fetchNotifications}
          className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300"
        >
          <RefreshCw size={12} />
          Refresh Feed
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Inbox Notifications</h1>
          <p className="text-xs text-slate-400 mt-1">Live alerts containing wallet updates, product purchases, fulfillment reports, and safety updates.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="animate-spin text-emerald-500" size={24} />
            <span className="text-[10px] text-slate-500">Retrieving alert nodes...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition flex gap-4 ${
                  n.read
                    ? 'bg-slate-900/10 border-slate-900/60 text-slate-400'
                    : 'bg-slate-900/40 border-emerald-950/30 text-slate-100'
                }`}
              >
                <div className="mt-1">
                  <span className={`p-2 rounded-xl block ${
                    n.read ? 'bg-slate-950 text-slate-600' : 'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    <Bell size={16} />
                  </span>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold">{n.title}</span>
                    <span className="text-[9px] text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{n.message}</p>
                  
                  {!n.read && (
                    <button
                      onClick={() => handleMarkAsRead(n.id)}
                      className="mt-3 text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <CheckCircle size={10} />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-12 bg-slate-900/10 border border-slate-900/40 rounded-2xl text-center text-xs text-slate-500">
                Your notifications box is completely empty.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
