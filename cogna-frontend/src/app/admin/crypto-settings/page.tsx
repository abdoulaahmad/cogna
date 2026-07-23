'use client'
import React from 'react'
import { api } from '@/lib/api'
import { getErrorMessage } from '@/lib/error-message'
import { Bitcoin, Save, ShieldCheck, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import {
  AdminPageHeader, AdminPanel, AdminError, AdminLoading,
  primaryButton, secondaryButton, fieldClass
} from '@/components/admin/admin-ui'

interface CryptoSettings {
  rateNgn: number | null
  walletAddress: string | null
  testMode: boolean
  configured: boolean
}

export default function AdminCryptoSettingsPage() {
  const [settings, setSettings] = React.useState<CryptoSettings | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  const [rateNgn, setRateNgn] = React.useState('')
  const [walletAddress, setWalletAddress] = React.useState('')
  const [plisioSecretKey, setPlisioSecretKey] = React.useState('')
  const [testMode, setTestMode] = React.useState(false)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/admin/crypto-settings')
      const data = res.data.data as CryptoSettings
      setSettings(data)
      setRateNgn(data.rateNgn ? String(data.rateNgn) : '')
      setWalletAddress(data.walletAddress ?? '')
      setTestMode(data.testMode)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load crypto settings.'))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { void load() }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const rate = Number(rateNgn)
    if (!rate || rate <= 0) { setError('Exchange rate must be a positive number.'); return }
    if (!walletAddress || walletAddress.length < 20) { setError('Enter a valid BEP20 wallet address.'); return }

    setSaving(true); setError(null); setSuccess(null)
    try {
      await api.put('/admin/crypto-settings', {
        rateNgn: rate,
        walletAddress,
        ...(plisioSecretKey ? { plisioSecretKey } : {}),
        testMode,
      })
      setSuccess('Crypto settings saved successfully. New rate applies to all new invoices.')
      setPlisioSecretKey('')
      await load()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to save crypto settings.'))
    } finally {
      setSaving(false)
    }
  }

  const previewNgn = rateNgn && Number(rateNgn) > 0
    ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(rateNgn))
    : null

  return (
    <div className="space-y-8 p-5 sm:p-8 xl:p-10 max-w-3xl">
      <AdminPageHeader
        eyebrow="Crypto payments"
        title="Crypto Settings"
        description="Set the USDT (BEP20) exchange rate and your wallet address. Customers can then fund their wallets using USDT on the Binance Smart Chain."
        action={
          <button onClick={() => void load()} className={secondaryButton}>
            <RefreshCw size={14} />Refresh
          </button>
        }
      />

      {loading && <AdminLoading label="Loading crypto settings…" />}
      {!loading && error && <AdminError message={error} />}

      {!loading && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Status Banner */}
          <AdminPanel>
            <div className="flex items-center gap-4 p-5">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${settings?.configured ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400' : 'border-amber-400/25 bg-amber-400/10 text-amber-400'}`}>
                <Bitcoin size={22} />
              </span>
              <div>
                <p className="font-bold text-white">
                  {settings?.configured ? 'Crypto funding is active' : 'Not yet configured'}
                </p>
                <p className="text-xs text-emerald-100/55 mt-0.5">
                  {settings?.configured
                    ? `Current rate: 1 USDT = ${previewNgn ?? '—'} • ${settings.testMode ? 'TEST MODE' : 'LIVE MODE'}`
                    : 'Set the rate and wallet address below to enable USDT funding for customers.'}
                </p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="p-6 space-y-6">
              <h2 className="text-sm font-bold text-white">Exchange Rate</h2>

              <div>
                <label className="block text-xs font-bold text-emerald-100/60 mb-2">
                  1 USDT = ₦ (Nigerian Naira)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={rateNgn}
                  onChange={(e) => setRateNgn(e.target.value)}
                  placeholder="e.g. 1620"
                  className={fieldClass}
                />
                {previewNgn && (
                  <p className="mt-2 text-xs text-[#F8D56B] flex items-center gap-1.5">
                    <Info size={12} />
                    Preview: 1 USDT → {previewNgn} • 10 USDT → {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(Number(rateNgn) * 10)}
                  </p>
                )}
                <p className="mt-2 text-[11px] text-emerald-100/40 flex items-start gap-1.5">
                  <AlertTriangle size={11} className="mt-0.5 shrink-0 text-amber-400" />
                  Changing this rate only affects new invoices. In-flight payments retain the rate locked at invoice creation.
                </p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="p-6 space-y-6">
              <h2 className="text-sm font-bold text-white">USDT BEP20 Wallet Address</h2>
              <div>
                <label className="block text-xs font-bold text-emerald-100/60 mb-2">
                  Your Plisio-managed BEP20 receiving address
                </label>
                <input
                  type="text"
                  required
                  minLength={20}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x…"
                  className={`${fieldClass} font-mono`}
                />
                <p className="mt-2 text-[11px] text-emerald-100/40">
                  This is shown to customers on the payment page so they can confirm the destination before paying.
                </p>
              </div>
            </div>
          </AdminPanel>

          <AdminPanel>
            <div className="p-6 space-y-6">
              <h2 className="text-sm font-bold text-white">Plisio API Key <span className="text-emerald-100/40 font-normal">(optional update)</span></h2>
              <div>
                <label className="block text-xs font-bold text-emerald-100/60 mb-2">
                  Secret API key from your Plisio account
                </label>
                <input
                  type="password"
                  value={plisioSecretKey}
                  onChange={(e) => setPlisioSecretKey(e.target.value)}
                  placeholder="Leave blank to keep existing key"
                  className={fieldClass}
                />
                <p className="mt-2 text-[11px] text-emerald-100/40">
                  The key is encrypted before storage. It is never logged or exposed in responses.
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-2xl border border-amber-400/15 bg-amber-400/5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={(e) => setTestMode(e.target.checked)}
                    className="h-4 w-4 rounded border-emerald-100/20 bg-black/20 accent-[#D4AF37]"
                  />
                  <div>
                    <p className="text-sm font-bold text-amber-300">Enable Test Mode</p>
                    <p className="text-[11px] text-amber-300/60 mt-0.5">
                      In test mode, Plisio invoice creation is bypassed and a mock URL is returned. No real USDT is required. Use this during development.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </AdminPanel>

          {success && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-950/30 p-4 text-sm text-emerald-200">
              <ShieldCheck size={17} className="text-emerald-400 shrink-0" />
              {success}
            </div>
          )}
          {error && <AdminError message={error} />}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save crypto settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
