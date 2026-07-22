'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, MessageSquare, Send, ShieldAlert, User, CheckCircle, RefreshCw } from 'lucide-react'
import { AdminError, AdminLoading, AdminPageHeader, AdminPanel, primaryButton, secondaryButton } from '@/components/admin/admin-ui'
import Link from 'next/link'
import { useAuthStore } from '@/stores/auth'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
interface Message { id: string; senderId: string; message: string; createdAt: string; sender: { email: string; role: string; adminRole?: string } }
interface TicketDetail { id: string; subject: string; status: TicketStatus; orderId: string | null; createdAt: string; user: { email: string; fullName: string }; order: { id: string; status: string; productId: string } | null; messages: Message[] }

const statusColors: Record<TicketStatus, string> = { OPEN: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', IN_PROGRESS: 'text-amber-400 bg-amber-400/10 border-amber-400/20', RESOLVED: 'text-sky-400 bg-sky-400/10 border-sky-400/20', CLOSED: 'text-slate-400 bg-slate-400/10 border-slate-400/20' }

export default function AdminTicketDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const { user } = useAuthStore()
  
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [replyText, setReplyText] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [updating, setUpdating] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get(`/admin/support/tickets/${id}`)
      setTicket(res.data.data)
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch ticket info'))
    } finally {
      setLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/admin/support/tickets/${id}/messages`, { message: replyText })
      if (res.data.success) {
        setReplyText('')
        await load()
      }
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'Failed to send message.'))
    } finally {
      setSending(false)
    }
  }

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!window.confirm(`Change ticket status to ${newStatus}?`)) return
    setUpdating(true)
    try {
      const res = await api.patch(`/admin/support/tickets/${id}/status`, { status: newStatus })
      if (res.data.success) {
        setTicket(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: unknown) {
      window.alert(getErrorMessage(err, 'Failed to update status.'))
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="p-8"><AdminLoading label="Loading ticket details..." /></div>
  if (error || !ticket) return <div className="p-8"><AdminError message={error || 'Ticket not found'} /><button onClick={() => router.push('/admin/tickets')} className={`mt-4 ${secondaryButton}`}>Back to tickets</button></div>

  return (
    <div className="space-y-6 p-5 sm:p-8 xl:p-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/tickets')} className="p-2 rounded-xl border border-emerald-100/10 text-emerald-100/60 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{ticket.subject}</h1>
          <p className="text-xs text-emerald-100/50 mt-1">Ticket {ticket.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AdminPanel className="flex-1 flex flex-col min-h-[500px]">
            <div className="p-5 border-b border-emerald-100/10 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2"><MessageSquare size={16} className="text-[#D4AF37]"/> Conversation</h2>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[ticket.status]}`}>
                {ticket.status}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6 max-h-[60vh]">
              {ticket.messages.map((msg) => {
                const isAdmin = msg.sender.role === 'ADMIN' || msg.sender.role === 'SUPER_ADMIN'
                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isAdmin ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                    <div className="shrink-0 mt-1">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs ${isAdmin ? 'bg-[#D4AF37]/20 text-[#F8D56B] border border-[#D4AF37]/30' : 'bg-white/5 text-emerald-100/60 border border-emerald-100/10'}`}>
                        {isAdmin ? <ShieldAlert size={14} /> : <User size={14} />}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] text-emerald-100/40 px-1">
                        <span className="font-bold text-emerald-100/60">{isAdmin ? (msg.sender.adminRole || 'ADMIN') : 'CUSTOMER'}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleString()}</span>
                      </div>
                      <div className={`p-4 text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-[#062C23] border border-[#D4AF37]/20 text-emerald-50 rounded-2xl rounded-tr-sm'
                          : 'bg-white/5 border border-emerald-100/10 text-emerald-100/90 rounded-2xl rounded-tl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 border-t border-emerald-100/10 bg-black/20">
              {ticket.status !== 'CLOSED' ? (
                <form onSubmit={handleSendReply} className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Type your reply to the customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 rounded-xl border border-emerald-100/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-emerald-100/30 focus:border-[#F8D56B] focus:outline-none focus:ring-1 focus:ring-[#F8D56B]"
                  />
                  <button type="submit" disabled={sending} className={primaryButton}>
                    {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                    Reply
                  </button>
                </form>
              ) : (
                <div className="text-center py-3 text-sm text-emerald-100/40">
                  This ticket is closed. Replies are disabled.
                </div>
              )}
            </div>
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel>
            <div className="p-5 border-b border-emerald-100/10">
              <h3 className="text-sm font-bold">Customer details</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-100/40 font-bold mb-1">Name</p>
                <p className="text-sm font-semibold">{ticket.user.fullName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-100/40 font-bold mb-1">Email</p>
                <p className="text-sm">{ticket.user.email}</p>
              </div>
              <div className="pt-2">
                <Link href={`/admin/users?search=${encodeURIComponent(ticket.user.email)}`} className="text-xs text-[#F8D56B] hover:underline">
                  View user profile &rarr;
                </Link>
              </div>
            </div>
          </AdminPanel>

          {ticket.orderId && ticket.order && (
            <AdminPanel>
              <div className="p-5 border-b border-emerald-100/10">
                <h3 className="text-sm font-bold">Linked Order</h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-100/40 font-bold mb-1">Order ID</p>
                  <p className="text-xs font-mono break-all">{ticket.orderId}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-emerald-100/40 font-bold mb-1">Status</p>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/10">{ticket.order.status}</span>
                </div>
                <div className="pt-2">
                  <Link href={`/admin/orders`} className="text-xs text-[#F8D56B] hover:underline">
                    View in orders &rarr;
                  </Link>
                </div>
              </div>
            </AdminPanel>
          )}

          <AdminPanel>
            <div className="p-5 border-b border-emerald-100/10">
              <h3 className="text-sm font-bold">Ticket actions</h3>
            </div>
            <div className="p-5 flex flex-col gap-3">
              {ticket.status !== 'OPEN' && (
                <button disabled={updating} onClick={() => handleUpdateStatus('OPEN')} className={`${secondaryButton} justify-center`}>
                  Re-open ticket
                </button>
              )}
              {ticket.status !== 'IN_PROGRESS' && (
                <button disabled={updating} onClick={() => handleUpdateStatus('IN_PROGRESS')} className={`${secondaryButton} justify-center`}>
                  Mark as In Progress
                </button>
              )}
              {ticket.status !== 'RESOLVED' && (
                <button disabled={updating} onClick={() => handleUpdateStatus('RESOLVED')} className={`${secondaryButton} justify-center text-sky-400 hover:border-sky-400/30 hover:bg-sky-400/10`}>
                  Mark as Resolved
                </button>
              )}
              {ticket.status !== 'CLOSED' && (
                <button disabled={updating} onClick={() => handleUpdateStatus('CLOSED')} className={`${secondaryButton} justify-center text-rose-400 hover:border-rose-400/30 hover:bg-rose-400/10`}>
                  Close ticket
                </button>
              )}
            </div>
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
