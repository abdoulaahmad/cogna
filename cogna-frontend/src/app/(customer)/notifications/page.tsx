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
import CustomerPortalNav from '@/components/layout/customer-portal-nav';

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
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/notifications" variant="sidebar"/>
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-[#F8D56B]">Your alerts</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Notifications</h1>
              <p className="mt-2 text-sm text-emerald-100/55">Updates on your wallet, orders, and account security.</p>
            </div>
            <button
              onClick={() => void fetchNotifications()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-xs font-black text-[#062C23] hover:bg-[#F8D56B]"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh feed
            </button>
          </section>

          {error && (
            <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-950/25 p-6 text-sm text-rose-100">
              {error}
              <button type="button" onClick={() => void fetchNotifications()} className="ml-3 font-bold text-[#F8D56B]">Retry</button>
            </div>
          )}

          <section className="mt-8 rounded-2xl border border-emerald-100/10 bg-[#061915] p-5 sm:p-6">
            {loading ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <RefreshCw className="animate-spin text-[#F8D56B]" size={30} />
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 rounded-2xl border p-5 transition ${
                      n.read
                        ? 'border-emerald-100/[.03] bg-white/[.02] text-emerald-100/60'
                        : 'border-emerald-100/15 bg-[linear-gradient(140deg,rgba(7,55,43,.4),rgba(3,25,21,.6))] text-white'
                    }`}
                  >
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      n.read 
                        ? 'border-white/5 bg-white/5 text-emerald-100/40' 
                        : 'border-[#F8D56B]/25 bg-[#D4AF37]/10 text-[#F8D56B]'
                    }`}>
                      <Bell size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-sm font-bold">{n.title}</p>
                        <p className="shrink-0 text-[11px] text-emerald-100/40">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className={`mt-1 text-xs leading-relaxed ${n.read ? 'text-emerald-100/40' : 'text-emerald-100/70'}`}>
                        {n.message}
                      </p>
                      
                      {!n.read && (
                        <button
                          onClick={() => void handleMarkAsRead(n.id)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-[11px] font-bold text-emerald-300 hover:text-[#F8D56B]"
                        >
                          <CheckCircle size={14} />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[200px] flex-col items-center justify-center py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100/10 bg-white/[0.02] text-emerald-100/20">
                  <Bell size={24} />
                </span>
                <p className="mt-4 text-sm text-emerald-100/50">Your notifications box is completely empty.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
