'use client';

import React, { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
  KeyRound, ShieldCheck, AlertTriangle, CheckCircle2, ShieldAlert,
  ShieldOff, ToggleLeft, ToggleRight, RefreshCw,
} from 'lucide-react';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';
import PinInput from '@/components/ui/PinInput';

type PinStatus = { transactionPinEnabled: boolean; hasPinSet: boolean };
type PinMode = 'current-pin' | 'password';

export default function SecurityPage() {
  const { user, updateUser } = useAuthStore();

  // ── Password change ──────────────────────────────────────────────────────
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  // ── Email verification ───────────────────────────────────────────────────
  const [verifying, setVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verMsg, setVerMsg] = useState<string | null>(null);
  const [verErr, setVerErr] = useState<string | null>(null);

  // ── Transaction PIN ───────────────────────────────────────────────────────
  const [pinStatus, setPinStatus] = useState<PinStatus | null>(null);
  const [pinLoading, setPinLoading] = useState(true);
  const [pinMode, setPinMode] = useState<PinMode>('current-pin');

  // Change/reset PIN form
  const [proofPin, setProofPin] = useState('');     // current PIN proof
  const [proofPw, setProofPw] = useState('');       // password proof
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFormMsg, setPinFormMsg] = useState<string | null>(null);
  const [pinFormErr, setPinFormErr] = useState<string | null>(null);
  const [pinFormLoading, setPinFormLoading] = useState(false);

  // Toggle PIN requirement
  const [toggleProofPin, setToggleProofPin] = useState('');
  const [toggleProofPw, setToggleProofPw] = useState('');
  const [toggleMode, setToggleMode] = useState<PinMode>('current-pin');
  const [toggleMsg, setToggleMsg] = useState<string | null>(null);
  const [toggleErr, setToggleErr] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Load PIN status on mount
  useEffect(() => {
    api.get<{ success: boolean; data: PinStatus }>('/profile/pin/status')
      .then((res) => { if (res.data.success) setPinStatus(res.data.data); })
      .catch(() => {})
      .finally(() => setPinLoading(false));
  }, []);

  // ── Password change handler ───────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true); setPwMessage(null); setPwError(null);
    try {
      const res = await api.post('/profile/change-password', { oldPassword, newPassword });
      if (res.data.success) { setPwMessage('Password updated successfully'); setOldPassword(''); setNewPassword(''); }
      else setPwError(res.data.message || 'Password update failed');
    } catch (err) { setPwError(getErrorMessage(err, 'Connection failure')); }
    finally { setPwLoading(false); }
  };

  // ── Email verification handlers ───────────────────────────────────────────
  const handleRequestVerification = async () => {
    setVerifying(true); setVerMsg(null); setVerErr(null);
    try {
      const res = await api.post('/profile/verify-email-request');
      if (res.data.success) setVerMsg('Verification request accepted. Delivery requires transactional email to be configured for this environment.');
      else setVerErr(res.data.message || 'Verification request failed');
    } catch (err) { setVerErr(getErrorMessage(err, 'Request failure')); }
    finally { setVerifying(false); }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true); setVerMsg(null); setVerErr(null);
    try {
      const res = await api.post('/profile/verify-email', { token: verificationToken });
      if (res.data.success) { setVerMsg('Email verified successfully!'); updateUser({ emailVerified: true }); setVerificationToken(''); }
      else setVerErr(res.data.message || 'Verification failed');
    } catch (err) { setVerErr(getErrorMessage(err, 'Verification failure')); }
    finally { setVerifying(false); }
  };

  // ── PIN change/reset handler ──────────────────────────────────────────────
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinFormErr(null); setPinFormMsg(null);
    if (newPin.length !== 6) { setPinFormErr('New PIN must be exactly 6 digits'); return; }
    if (newPin !== confirmPin) { setPinFormErr('PINs do not match'); return; }
    if (pinMode === 'current-pin' && proofPin.length !== 6) { setPinFormErr('Enter your current 6-digit PIN'); return; }
    if (pinMode === 'password' && !proofPw) { setPinFormErr('Enter your account password'); return; }

    setPinFormLoading(true);
    try {
      const body: Record<string, string> = { newPin };
      if (pinMode === 'current-pin') body.currentPin = proofPin;
      else body.password = proofPw;

      const res = await api.post('/profile/pin', body);
      if (res.data.success) {
        setPinFormMsg('Transaction PIN updated successfully');
        setProofPin(''); setProofPw(''); setNewPin(''); setConfirmPin('');
        setPinStatus((prev) => prev ? { ...prev, hasPinSet: true } : prev);
      } else {
        setPinFormErr(res.data.message || 'Failed to update PIN');
      }
    } catch (err) { setPinFormErr(getErrorMessage(err, 'Update failed')); }
    finally { setPinFormLoading(false); }
  };

  // ── PIN enable/disable handler ────────────────────────────────────────────
  const handleTogglePinStatus = async () => {
    if (!pinStatus) return;
    const enabling = !pinStatus.transactionPinEnabled;

    setToggleErr(null); setToggleMsg(null);

    // Disabling requires proof of identity
    if (!enabling) {
      if (toggleMode === 'current-pin' && toggleProofPin.length !== 6) { setToggleErr('Enter your current 6-digit PIN'); return; }
      if (toggleMode === 'password' && !toggleProofPw) { setToggleErr('Enter your account password'); return; }
    }

    setToggleLoading(true);
    try {
      const body: Record<string, unknown> = { enabled: enabling };
      if (!enabling) {
        if (toggleMode === 'current-pin') body.currentPin = toggleProofPin;
        else body.password = toggleProofPw;
      }

      const res = await api.put('/profile/pin/status', body);
      if (res.data.success) {
        setToggleMsg(`Transaction PIN ${enabling ? 'enabled' : 'disabled'} successfully`);
        setPinStatus((prev) => prev ? { ...prev, transactionPinEnabled: enabling } : prev);
        setToggleProofPin(''); setToggleProofPw('');
      } else {
        setToggleErr(res.data.message || 'Failed to update PIN status');
      }
    } catch (err) { setToggleErr(getErrorMessage(err, 'Update failed')); }
    finally { setToggleLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/security" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">

          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Security</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Protect your account.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Configure your login credentials, transaction PIN, email verification, and account status.
          </p>

          {pwMessage && (
            <div className="mt-7 p-4 bg-emerald-950/30 border border-emerald-900/40 text-emerald-100 text-sm rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={18} className="text-[#F8D56B]" />{pwMessage}
            </div>
          )}
          {pwError && (
            <div className="mt-7 p-4 bg-rose-950/30 border border-rose-900/40 text-rose-100 text-sm rounded-2xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-400" />{pwError}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* ── Change Password ─────────────────────────────────────────── */}
            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]"><KeyRound size={20} /></span>
                <div>
                  <h2 className="font-display text-xl font-bold">Change Password</h2>
                  <p className="mt-1 text-xs text-emerald-100/60">Update your account access credentials.</p>
                </div>
              </div>
              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <label className="block text-xs font-bold text-emerald-100/70">Current Password
                  <input type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors" />
                </label>
                <label className="block text-xs font-bold text-emerald-100/70">New Password
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors" />
                </label>
                <button type="submit" disabled={pwLoading || !oldPassword || !newPassword}
                  className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors w-full sm:w-auto mt-2">
                  {pwLoading ? 'Updating…' : 'Save New Password'}
                </button>
              </form>
            </section>

            {/* ── Email Verification ──────────────────────────────────────── */}
            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]"><ShieldCheck size={20} /></span>
                  <div>
                    <h2 className="font-display text-xl font-bold">Email Verification</h2>
                    <p className="mt-1 text-xs text-emerald-100/60">Verify your email address to unlock all features.</p>
                  </div>
                </div>
                {user?.emailVerified ? (
                  <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl text-emerald-100 text-sm flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-[#F8D56B]" />
                    <span>Your email address <strong>{user?.email}</strong> is fully verified.</span>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-2xl text-amber-100 text-sm flex items-start gap-3">
                      <ShieldAlert size={18} className="text-[#F8D56B] shrink-0 mt-0.5" />
                      <span>Your email is not verified. Please request verification.</span>
                    </div>
                    <button onClick={handleRequestVerification} disabled={verifying}
                      className="w-full rounded-full border border-emerald-100/20 px-5 py-3 text-sm font-bold text-emerald-100 hover:border-[#D4AF37] disabled:opacity-50 transition-colors">
                      Request Verification Code
                    </button>
                    {(verMsg || verErr) && (
                      <div className="space-y-4 mt-4">
                        {verMsg && <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-100 text-xs rounded-2xl font-mono whitespace-pre-wrap break-all leading-relaxed">{verMsg}</div>}
                        {verErr && <div className="p-4 bg-rose-950/20 border border-rose-900/30 text-rose-100 text-xs rounded-2xl leading-relaxed">{verErr}</div>}
                        <form onSubmit={handleConfirmVerification} className="space-y-3 pt-2">
                          <input type="text" placeholder="Paste Verification Token here" required value={verificationToken} onChange={(e) => setVerificationToken(e.target.value)}
                            className="w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors" />
                          <button type="submit" disabled={verifying || !verificationToken}
                            className="w-full rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors">
                            Confirm Code
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs font-bold text-emerald-100/50 border-t border-emerald-100/10 pt-5 mt-8 flex justify-between items-center">
                <span>Account Status</span>
                <span className="uppercase tracking-wider text-[#F8D56B] bg-[#D4AF37]/10 px-3 py-1 rounded-full">{user?.status || 'Unknown'}</span>
              </div>
            </section>

            {/* ── Transaction PIN ─────────────────────────────────────────── */}
            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]">
                    {pinStatus?.transactionPinEnabled ? <ShieldCheck size={20} /> : <ShieldOff size={20} />}
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold">Transaction PIN</h2>
                    <p className="mt-1 text-xs text-emerald-100/60">
                      Protects your wallet purchases with a 6-digit PIN.
                    </p>
                  </div>
                </div>

                {/* Status badge */}
                {pinLoading ? (
                  <RefreshCw size={16} className="animate-spin text-emerald-100/40 mt-1" />
                ) : pinStatus && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${pinStatus.transactionPinEnabled ? 'text-[#F8D56B] bg-[#D4AF37]/10' : 'text-rose-300 bg-rose-950/40'}`}>
                    {pinStatus.transactionPinEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                )}
              </div>

              {!pinStatus?.transactionPinEnabled && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-900/30 bg-rose-950/20 p-3 text-xs text-rose-200">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                  PIN protection is off — wallet purchases can be made without a PIN.
                </div>
              )}

              {/* First-time setup prompt for existing accounts */}
              {pinStatus && !pinStatus.hasPinSet && (
                <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-900/30 bg-amber-950/20 p-4 text-xs text-amber-100">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="font-bold text-amber-200">You have not set a Transaction PIN yet.</p>
                    <p className="mt-1 leading-5 text-amber-100/70">
                      Use the <span className="font-bold text-amber-200">Change / Reset PIN</span> form below — select <span className="font-bold">&ldquo;Forgot PIN&rdquo;</span> and enter your account password to set one for the first time. Once set, you can enable PIN protection for wallet purchases.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-6 md:grid-cols-2">

                {/* ── Change / Reset PIN ──── */}
                <div className="rounded-2xl border border-emerald-100/10 bg-black/10 p-5">
                  <p className="text-sm font-bold text-emerald-100">Change / Reset PIN</p>

                  {/* Mode tabs */}
                  <div className="mt-3 flex gap-2">
                    {(['current-pin', 'password'] as PinMode[]).map((m) => (
                      <button key={m} type="button" onClick={() => { setPinMode(m); setPinFormErr(null); }}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${pinMode === m ? 'bg-[#D4AF37] text-[#062C23]' : 'border border-emerald-100/20 text-emerald-100/60 hover:text-emerald-100'}`}>
                        {m === 'current-pin' ? 'I know my PIN' : 'Forgot PIN'}
                      </button>
                    ))}
                  </div>

                  {pinFormMsg && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3 text-xs text-emerald-100">
                      <CheckCircle2 size={14} className="text-[#F8D56B]" />{pinFormMsg}
                    </div>
                  )}
                  {pinFormErr && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-900/30 bg-rose-950/20 p-3 text-xs text-rose-200">
                      <AlertTriangle size={14} className="text-rose-400" />{pinFormErr}
                    </div>
                  )}

                  <form onSubmit={handleChangePin} className="mt-4 space-y-4">
                    {pinMode === 'current-pin' ? (
                      <PinInput id="proof-pin" label="Current PIN" value={proofPin} onChange={setProofPin} disabled={pinFormLoading} />
                    ) : (
                      <label className="block text-xs font-bold text-emerald-100/70">Account Password
                        <input type="password" required value={proofPw} onChange={(e) => setProofPw(e.target.value)} disabled={pinFormLoading}
                          placeholder="Your login password"
                          className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-50" />
                      </label>
                    )}
                    <PinInput id="new-pin" label="New PIN" value={newPin} onChange={setNewPin} disabled={pinFormLoading} />
                    <PinInput id="confirm-new-pin" label="Confirm New PIN" value={confirmPin} onChange={setConfirmPin} disabled={pinFormLoading} />

                    <button type="submit" disabled={pinFormLoading || newPin.length !== 6 || newPin !== confirmPin}
                      className="w-full rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors">
                      {pinFormLoading ? 'Saving…' : 'Save New PIN'}
                    </button>
                  </form>
                </div>

                {/* ── Enable / Disable Toggle ──── */}
                <div className="rounded-2xl border border-emerald-100/10 bg-black/10 p-5">
                  <p className="text-sm font-bold text-emerald-100">
                    {pinStatus?.transactionPinEnabled ? 'Disable PIN Requirement' : 'Enable PIN Requirement'}
                  </p>
                  <p className="mt-1 text-xs text-emerald-100/55 leading-5">
                    {pinStatus?.transactionPinEnabled
                      ? 'Disabling requires your current PIN or account password for security.'
                      : pinStatus?.hasPinSet
                        ? 'Re-enabling is instant — no credential required.'
                        : 'Set a PIN using the form on the left first, then you can enable PIN protection here.'}
                  </p>

                  {toggleMsg && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-900/30 bg-emerald-950/20 p-3 text-xs text-emerald-100">
                      <CheckCircle2 size={14} className="text-[#F8D56B]" />{toggleMsg}
                    </div>
                  )}
                  {toggleErr && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-900/30 bg-rose-950/20 p-3 text-xs text-rose-200">
                      <AlertTriangle size={14} className="text-rose-400" />{toggleErr}
                    </div>
                  )}

                  {/* Proof fields — only shown when disabling */}
                  {pinStatus?.transactionPinEnabled && (
                    <div className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        {(['current-pin', 'password'] as PinMode[]).map((m) => (
                          <button key={m} type="button" onClick={() => { setToggleMode(m); setToggleErr(null); }}
                            className={`rounded-full px-3 py-1 text-[11px] font-bold transition-colors ${toggleMode === m ? 'bg-[#D4AF37] text-[#062C23]' : 'border border-emerald-100/20 text-emerald-100/60 hover:text-emerald-100'}`}>
                            {m === 'current-pin' ? 'Use PIN' : 'Use Password'}
                          </button>
                        ))}
                      </div>

                      {toggleMode === 'current-pin' ? (
                        <PinInput id="toggle-proof-pin" label="Current PIN" value={toggleProofPin} onChange={setToggleProofPin} disabled={toggleLoading} />
                      ) : (
                        <label className="block text-xs font-bold text-emerald-100/70">Account Password
                          <input type="password" value={toggleProofPw} onChange={(e) => setToggleProofPw(e.target.value)} disabled={toggleLoading}
                            placeholder="Your login password"
                            className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors disabled:opacity-50" />
                        </label>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={toggleLoading || pinLoading || (!pinStatus?.transactionPinEnabled && !pinStatus?.hasPinSet)}
                    onClick={() => void handleTogglePinStatus()}
                    className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
                      pinStatus?.transactionPinEnabled
                        ? 'border border-rose-500/40 text-rose-300 hover:bg-rose-950/30'
                        : 'bg-[#D4AF37] text-[#062C23] hover:bg-[#F8D56B]'
                    }`}
                  >
                    {toggleLoading
                      ? 'Updating…'
                      : pinStatus?.transactionPinEnabled
                        ? <><ToggleLeft size={17} /> Disable PIN Protection</>
                        : <><ToggleRight size={17} /> Enable PIN Protection</>}
                  </button>
                </div>

              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
