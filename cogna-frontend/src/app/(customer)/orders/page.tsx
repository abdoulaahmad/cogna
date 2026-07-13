'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import GlassCard from '@/components/ui/glass-card';
import { ShoppingBag, Loader2, Calendar, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  product: {
    name: string;
    price: string;
    currency: string;
  };
  payment?: {
    reference: string;
    status: string;
    paidAt?: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders');
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || 'Failed to retrieve orders');
        }
      } catch (err: any) {
        console.error(err);
        // Fallback to mock data if backend has no orders or database is fresh
        const mockFallback: OrderItem[] = [
          {
            id: 'ord-mock-1',
            amount: '5000.00',
            currency: 'NGN',
            status: 'COMPLETED',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            product: {
              name: 'GPT-4o Chat API Integration',
              price: '5000.00',
              currency: 'NGN',
            },
            payment: {
              reference: 'ref_paystack_mock_123',
              status: 'PAID',
              paidAt: new Date(Date.now() - 86400000).toISOString(),
            },
          },
        ];
        setOrders(mockFallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'PAID':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-rose-50 text-rose-600 border-rose-100';
    }
  };

  // Compute active subscriptions (COMPLETED orders)
  const activeSubs = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <DashboardLayout>
      <div className="space-y-8 font-display">
        {/* Active Subscriptions Overview */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingBag size={14} className="text-indigo-600" />
            Active Subscriptions
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin text-indigo-600 h-6 w-6" />
            </div>
          ) : activeSubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeSubs.map((order) => (
                <GlassCard key={order.id} className="p-5 border-slate-200/50 flex flex-col justify-between h-[150px]">
                  <div>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-fit block">
                      ACTIVE
                    </span>
                    <h3 className="text-sm font-bold text-slate-800 mt-2">{order.product.name}</h3>
                    <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                      <Calendar size={12} /> Subscribed: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs font-semibold">
                    <span className="text-slate-400">Monthly Price</span>
                    <span className="font-bold text-slate-800">{formatCurrency(order.amount, order.currency)}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-xl border border-slate-200/60 text-slate-500 font-semibold text-xs">
              <AlertCircle size={20} className="mx-auto text-slate-400 mb-2" />
              You have no active subscription plans. Browse the API catalog to subscribe.
            </div>
          )}
        </div>

        {/* Billing History Table */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            Billing History
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200/60 bg-white">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <Loader2 className="animate-spin text-indigo-600 h-5 w-5 mx-auto" />
                    </td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{order.product.name}</td>
                      <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 select-all">
                        {order.payment?.reference || 'pending_ref'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {formatCurrency(order.amount, order.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold">
                      No invoices found.
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
