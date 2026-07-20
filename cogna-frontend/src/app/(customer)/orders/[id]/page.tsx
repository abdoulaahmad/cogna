"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Printer,
  RefreshCw,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import CustomerPortalNav from "@/components/layout/customer-portal-nav";

type Order = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  createdAt: string;
  receiptReference: string | null;
  deliveryItems: string[];
  product: { name: string; description?: string | null };
  payment: { reference: string; status: string; paidAt: string | null } | null;
  statusEvents: Array<{
    id: string;
    status: string;
    note: string | null;
    createdAt: string;
  }>;
};
const money = (amount: string, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/customer/orders/${id}`);
      if (!response.data.success) throw new Error("Order could not be loaded.");
      setOrder(response.data.data);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Order could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function cancel() {
    if (
      !confirm(
        "Cancel this pending order? Any eligible wallet debit will be refunded through the backend ledger.",
      )
    )
      return;
    setCancelling(true);
    try {
      const response = await api.post(`/customer/orders/${id}/cancel`);
      if (!response.data.success)
        throw new Error(
          response.data.message || "Order could not be cancelled.",
        );
      await load();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, "Order could not be cancelled."));
    } finally {
      setCancelling(false);
    }
  }
  const printUrl = order?.receiptReference
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/customer/receipts/${order.receiptReference}/print`
    : null;
  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/orders" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-100/65 hover:text-[#F8D56B]"
          >
            <ArrowLeft size={16} /> Orders
          </Link>
          {loading ? (
            <div className="flex min-h-64 items-center justify-center">
              <RefreshCw className="animate-spin text-[#F8D56B]" size={28} />
            </div>
          ) : error || !order ? (
            <div className="mt-8 rounded-3xl border border-rose-300/25 bg-rose-950/25 p-6">
              <AlertTriangle className="text-rose-200" />
              <p className="mt-3 text-rose-100">
                {error || "Order not found."}
              </p>
            </div>
          ) : (
            <>
              <section className="mt-7 rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-7 shadow-premium-dark">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-[#F8D56B]">
                  {order.status}
                </p>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
                  <div>
                    <h1 className="font-display text-3xl font-bold">
                      {order.product.name}
                    </h1>
                    <p className="mt-2 text-sm text-emerald-100/65">
                      {order.product.description ||
                        "Your order is managed through Cogna’s verified payment and fulfillment process."}
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {money(order.amount, order.currency)}
                  </p>
                </div>
                <p className="mt-5 text-xs text-emerald-100/50">
                  Order: {order.id} · Created{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </section>
              {order.deliveryItems.length > 0 && (
                <section className="mt-6 rounded-[2rem] border border-[#D4AF37]/35 bg-[#D4AF37]/10 p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-[#F8D56B]">
                      Your delivery
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const content = order.deliveryItems.join("\\n\\n");
                        const blob = new Blob([content], {
                          type: "text/plain",
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `delivery_${order.id}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-1.5 rounded-full bg-[#D4AF37]/20 px-3 py-1.5 text-xs font-bold text-[#F8D56B] hover:bg-[#D4AF37]/30 transition-colors"
                    >
                      <Download size={14} /> Download .txt
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {order.deliveryItems.map((item, index) =>
                      item.startsWith("http") ? (
                        <a
                          key={`${index}-${item}`}
                          href={item}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="block break-all rounded-2xl border border-emerald-100/15 bg-black/20 p-4 text-sm text-emerald-100 underline decoration-[#D4AF37]/50 underline-offset-4"
                        >
                          {item}
                        </a>
                      ) : (
                        <code
                          key={`${index}-${item}`}
                          className="block break-all rounded-2xl border border-emerald-100/15 bg-black/20 p-4 text-sm text-emerald-100"
                        >
                          {item}
                        </code>
                      ),
                    )}
                  </div>
                </section>
              )}
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6">
                  <h2 className="font-display text-xl font-bold">
                    Fulfillment timeline
                  </h2>
                  <div className="mt-6 space-y-6 border-l border-emerald-100/20 pl-6">
                    {order.statusEvents.length ? (
                      order.statusEvents.map((event) => (
                        <div key={event.id} className="relative">
                          <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-[#D4AF37] ring-4 ring-[#062C23]" />
                          <p className="font-bold">{event.status}</p>
                          {event.note && (
                            <p className="mt-1 text-sm text-emerald-100/65">
                              {event.note}
                            </p>
                          )}
                          <p className="mt-2 flex items-center gap-2 text-xs text-emerald-100/45">
                            <Calendar size={13} />
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-emerald-100/60">
                        Status updates will appear here as your order
                        progresses.
                      </p>
                    )}
                  </div>
                </section>
                <aside className="space-y-4">
                  <section className="rounded-3xl border border-emerald-100/15 bg-[#061915] p-5">
                    <h2 className="font-bold">Payment and receipt</h2>
                    <p className="mt-3 text-xs text-emerald-100/60">
                      {order.payment?.reference || "Payment reference pending"}
                    </p>
                    {printUrl && (
                      <a
                        href={printUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 flex items-center justify-center gap-2 rounded-full border border-emerald-100/15 px-4 py-3 text-xs font-bold text-emerald-100 hover:border-[#D4AF37]"
                      >
                        <Printer size={15} /> Print receipt
                      </a>
                    )}
                  </section>
                  <Link
                    href={`/support?orderId=${order.id}`}
                    className="flex items-center justify-center gap-2 rounded-full border border-emerald-100/15 px-4 py-3 text-xs font-bold text-emerald-100 hover:border-[#D4AF37]"
                  >
                    <MessageSquare size={15} /> Get support
                  </Link>
                  {order.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={cancelling}
                      onClick={() => void cancel()}
                      className="w-full rounded-full border border-rose-200/30 bg-rose-950/20 px-4 py-3 text-xs font-bold text-rose-100 disabled:opacity-45"
                    >
                      {cancelling ? "Cancelling…" : "Cancel pending order"}
                    </button>
                  )}
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
