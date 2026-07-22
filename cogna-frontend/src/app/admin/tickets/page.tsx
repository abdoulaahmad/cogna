'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { Headphones, Search, MessageSquare, ArrowRight } from 'lucide-react'
import { AdminEmpty, AdminError, AdminLoading, AdminPageHeader, AdminPanel, AdminSearch, secondaryButton } from '@/components/admin/admin-ui'
import Link from 'next/link'

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketItem = { id: string; subject: string; status: TicketStatus; createdAt: string; updatedAt: string; user: { email: string; fullName: string } }
const badge: Record<TicketStatus, string> = { OPEN: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200', IN_PROGRESS: 'border-amber-300/20 bg-amber-300/10 text-amber-200', RESOLVED: 'border-sky-300/20 bg-sky-300/10 text-sky-200', CLOSED: 'border-white/10 bg-white/5 text-emerald-100/40' }

export default function AdminTicketsPage() {
  const [tickets, setTickets] = React.useState<TicketItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await api.get('/admin/support/tickets')
      setTickets(r.data.data || [])
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Unable to load support tickets.'))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const visible = React.useMemo(() => {
    const term = search.toLowerCase().trim()
    return term ? tickets.filter(t => [t.id, t.subject, t.user?.email || '', t.user?.fullName || ''].some(v => v.toLowerCase().includes(term))) : tickets
  }, [tickets, search])

  return (
    <div className="space-y-8 p-5 sm:p-8 xl:p-10">
      <AdminPageHeader 
        eyebrow="Customer help desk" 
        title="Support Tickets" 
        description="View customer inquiries, troubleshoot issues, and reply to support threads." 
      />
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <AdminSearch value={search} onChange={setSearch} placeholder="Search by subject, customer, or ID" />
        <p className="text-xs text-emerald-100/38">{visible.length} of {tickets.length} tickets</p>
      </div>
      
      {error && <AdminError message={error} />}
      
      <AdminPanel className="overflow-hidden">
        {loading && !tickets.length ? (
          <AdminLoading label="Loading tickets…" />
        ) : !visible.length ? (
          <AdminEmpty icon={MessageSquare} title="No support tickets" description="There are no support tickets matching your criteria." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-emerald-100/10 bg-black/15 text-[10px] uppercase tracking-[.14em] text-emerald-100/35">
                <tr>
                  <th className="px-6 py-4">Ticket ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/[.07]">
                {visible.map((t) => (
                  <tr key={t.id} className="hover:bg-white/[.025] transition-colors">
                    <td className="px-6 py-4">
                      <code className="block max-w-[120px] truncate text-[10px] text-white">{t.id}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="block font-bold text-white">{t.user?.fullName || 'Unknown'}</span>
                      <span className="block text-[10px] text-emerald-100/38">{t.user?.email || ''}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-100/70 max-w-[300px] truncate">{t.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${badge[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-6 py-4 text-emerald-100/38">{new Date(t.updatedAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">
                        <Link href={`/admin/tickets/${t.id}`} className={secondaryButton}>
                          <MessageSquare size={12}/> View & Reply
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  )
}
