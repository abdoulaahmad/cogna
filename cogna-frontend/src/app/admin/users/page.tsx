'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import {
  AdminEmpty, AdminError, AdminLoading, AdminPageHeader,
  AdminPanel, AdminSearch, fieldClass, primaryButton, secondaryButton,
} from '@/components/admin/admin-ui'
import { RefreshCw, ShieldCheck, UserCog, Users, X } from 'lucide-react'

type Wallet = { availableBalance: string; pendingBalance: string }
type User = {
  id: string; fullName: string; email: string
  role: 'CUSTOMER' | 'ADMIN' | 'DEVELOPER'
  adminRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATIONS' | 'SUPPORT' | 'FINANCE' | null
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING'
  emailVerified: boolean
  createdAt: string
  wallet: Wallet | null
  capabilities: { type: string }[]
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'SUPPORT', 'FINANCE'] as const
const STATUS_OPTIONS = ['ACTIVE', 'SUSPENDED', 'PENDING'] as const

const roleColor: Record<string, string> = {
  SUPER_ADMIN: 'bg-amber-400/15 text-amber-200',
  ADMIN: 'bg-indigo-400/15 text-indigo-200',
  OPERATIONS: 'bg-sky-400/15 text-sky-200',
  SUPPORT: 'bg-violet-400/15 text-violet-200',
  FINANCE: 'bg-emerald-400/15 text-emerald-200',
}
const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-400/10 text-emerald-300',
  SUSPENDED: 'bg-rose-400/10 text-rose-300',
  PENDING: 'bg-amber-400/10 text-amber-300',
}
const money = (v: string | null) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(v ?? 0))

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')
  const [editing, setEditing] = React.useState<User | null>(null)
  const [adminRole, setAdminRole] = React.useState<string>('')
  const [status, setStatus] = React.useState<string>('')
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data.data || [])
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Unable to load users.'))
    } finally { setLoading(false) }
  }, [])

  React.useEffect(() => {
    const t = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(t)
  }, [load])

  const visible = React.useMemo(() => {
    const term = search.toLowerCase().trim()
    return term
      ? users.filter(u => u.email.toLowerCase().includes(term) || u.fullName.toLowerCase().includes(term))
      : users
  }, [users, search])

  function openEditor(u: User) {
    setEditing(u)
    setAdminRole(u.adminRole ?? '')
    setStatus(u.status)
    setSaveError(null)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSaving(true); setSaveError(null)
    try {
      await api.post(`/admin/users/${editing.id}/role`, {
        adminRole: adminRole || undefined,
        status,
      })
      setEditing(null)
      await load()
    } catch (err: unknown) {
      setSaveError(getErrorMessage(err, 'Unable to update user.'))
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-8 p-5 sm:p-8 xl:p-10">
      <AdminPageHeader
        eyebrow="Identity & access management"
        title="User accounts"
        description="Manage admin roles and account status. Role changes take effect on next login � the user must log out and back in."
        action={
          <button onClick={() => void load()} className={secondaryButton}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />Refresh
          </button>
        }
      />

      {error && <AdminError message={error} />}

      <AdminPanel className="overflow-hidden">
        <div className="border-b border-emerald-100/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37]/10 text-[#F8D56B]">
                <Users size={18} />
              </span>
              <div>
                <h2 className="font-bold text-white">{users.length} accounts</h2>
                <p className="mt-0.5 text-xs text-emerald-100/38">Click Edit to assign an admin role</p>
              </div>
            </div>
            <div className="w-full sm:w-64">
              <AdminSearch value={search} onChange={setSearch} placeholder="Search name or email" />
            </div>
          </div>
        </div>

        {loading ? (
          <AdminLoading label="Loading users�" />
        ) : !visible.length ? (
          <AdminEmpty icon={Users} title="No users found" description="Registered accounts appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="border-b border-emerald-100/10 bg-black/15 text-[10px] uppercase tracking-[.14em] text-emerald-100/35">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Admin role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Wallet balance</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100/[.07]">
                {visible.map(u => (
                  <tr key={u.id} className="hover:bg-white/[.025]">
                    <td className="px-6 py-4">
                      <p className="font-bold text-white">{u.fullName}</p>
                      <p className="mt-0.5 text-[10px] text-emerald-100/40">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase text-white/50">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.adminRole ? (
                        <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${roleColor[u.adminRole] ?? ''}`}>
                          {u.adminRole}
                        </span>
                      ) : (
                        <span className="text-emerald-100/28">�</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${statusColor[u.status] ?? ''}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-emerald-100/60">
                      {u.wallet
                        ? money(u.wallet.availableBalance)
                        : <span className="text-emerald-100/28">No wallet</span>}
                    </td>
                    <td className="px-6 py-4 text-emerald-100/35">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        id={`edit-user-${u.id}`}
                        onClick={() => openEditor(u)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-100/15 px-3 py-1.5 text-[10px] font-bold text-emerald-100/55 transition hover:border-[#D4AF37]/30 hover:text-[#F8D56B]"
                      >
                        <UserCog size={12} />Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
          onClick={() => setEditing(null)}
        >
          <AdminPanel className="w-full max-w-md p-6 sm:p-7">
            <div onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#D4AF37]">Edit account</p>
                  <h2 className="mt-2 text-xl font-black text-white">{editing.fullName}</h2>
                  <p className="mt-1 text-xs text-emerald-100/38">{editing.email}</p>
                </div>
                <button onClick={() => setEditing(null)} className="text-emerald-100/40 hover:text-white">
                  <X size={19} />
                </button>
              </div>

              {saveError && (
                <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-xs text-rose-200">{saveError}</p>
              )}

              <form onSubmit={save} className="mt-6 space-y-4">
                <label className="block text-xs font-bold text-emerald-100/60">
                  Admin role
                  <select value={adminRole} onChange={e => setAdminRole(e.target.value)} className={fieldClass}>
                    <option value="">None (customer only)</option>
                    {ADMIN_ROLES.map(r => (
                      <option key={r} value={r}>{r.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <span className="mt-1.5 block text-[10px] font-normal text-emerald-100/35">
                    Setting an admin role upgrades the platform role to ADMIN. Changes take effect on next login.
                  </span>
                </label>

                <label className="block text-xs font-bold text-emerald-100/60">
                  Account status
                  <select value={status} onChange={e => setStatus(e.target.value)} className={fieldClass}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <button disabled={saving} type="submit" className={`${primaryButton} w-full`} id="save-user-edit">
                  <ShieldCheck size={15} />
                  {saving ? 'Saving�' : 'Save changes'}
                </button>
              </form>
            </div>
          </AdminPanel>
        </div>
      )}
    </div>
  )
}
