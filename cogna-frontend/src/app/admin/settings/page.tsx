'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { Save, ShieldCheck, RefreshCw, Megaphone, Activity } from 'lucide-react'
import {
  AdminPageHeader, AdminPanel, AdminError, AdminLoading,
  primaryButton, secondaryButton, fieldClass
} from '@/components/admin/admin-ui'

interface AnnouncementSettings {
  active: boolean
  message: string
  tone: string
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [active, setActive] = React.useState(false)
  const [message, setMessage] = React.useState('')
  const [tone, setTone] = React.useState('emerald')

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/admin/settings/announcement')
      const data = res.data.data as AnnouncementSettings
      setActive(data.active)
      setMessage(data.message)
      setTone(data.tone || 'emerald')
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load announcement settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (active && (!message || message.length < 2)) {
      setError('A message is required when the announcement is active.')
      return
    }

    setSaving(true); setError(null); setSuccess(null)
    try {
      await api.put('/admin/settings/announcement', {
        active,
        message,
        tone,
      })
      setSuccess('Global announcement saved successfully.')
      await load()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to save announcement settings.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 p-5 sm:p-8 xl:p-10 max-w-3xl">
      <AdminPageHeader
        eyebrow="Platform settings"
        title="Global Settings"
        description="Configure platform-wide settings like the global dashboard announcement banner."
        action={
          <button onClick={() => void load()} className={secondaryButton}>
            <RefreshCw size={14} />Refresh
          </button>
        }
      />

      {loading && <AdminLoading label="Loading settings…" />}
      {!loading && error && <AdminError message={error} />}

      {!loading && (
        <form onSubmit={handleSave} className="space-y-6">
          <AdminPanel>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-emerald-100/10 pb-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  <Megaphone size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">Global Announcement Banner</h2>
                  <p className="text-xs text-emerald-100/50 mt-0.5">Displays a full-width alert at the top of the customer dashboard.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl border border-emerald-100/10 bg-white/[.02]">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-100/20 bg-black/20 accent-[#D4AF37]"
                  />
                  <div>
                    <p className="text-sm font-bold text-white">Enable Announcement Banner</p>
                    <p className="text-[11px] text-emerald-100/45 mt-0.5">
                      Toggle whether the banner is currently visible to users.
                    </p>
                  </div>
                </label>
              </div>

              {active && (
                <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-emerald-100/60 mb-2">
                      Message Content
                    </label>
                    <input
                      type="text"
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. 🔥 New Gemini AI Pro is now in stock!"
                      className={fieldClass}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-100/60 mb-2">
                      Banner Tone (Color)
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value="emerald"
                          checked={tone === 'emerald'}
                          onChange={(e) => setTone(e.target.value)}
                          className="accent-emerald-400"
                        />
                        <span className="text-sm text-emerald-200">Emerald (Success/Info)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tone"
                          value="gold"
                          checked={tone === 'gold'}
                          onChange={(e) => setTone(e.target.value)}
                          className="accent-[#D4AF37]"
                        />
                        <span className="text-sm text-[#F8D56B]">Gold (Warning/Alert)</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Live Preview */}
                  <div className="pt-4">
                    <p className="text-xs font-bold text-emerald-100/40 mb-3 uppercase tracking-wider">Live Preview</p>
                    <div className={`flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-sm ${tone === 'gold' ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#F8D56B]' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'}`}>
                      <p className="text-sm font-bold leading-relaxed">{message || 'Your announcement message will appear here.'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AdminPanel>

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4 text-sm text-emerald-200">
              <ShieldCheck size={17} className="text-emerald-400 shrink-0" />
              {success}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save global settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
