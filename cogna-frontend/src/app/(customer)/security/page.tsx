'use client';

import React, { useState } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { KeyRound, ShieldCheck, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import CustomerPortalNav from '@/components/layout/customer-portal-nav';

export default function SecurityPage() {
  const { user, updateUser } = useAuthStore();
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [verMsg, setVerMsg] = useState<string | null>(null);
  const [verErr, setVerErr] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api.post('/profile/change-password', { oldPassword, newPassword });
      if (res.data.success) {
        setMessage('Password updated successfully');
        setOldPassword('');
        setNewPassword('');
      } else {
        setError(res.data.message || 'Password update failed');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Connection failure'));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerifying(true);
    setVerMsg(null);
    setVerErr(null);
    try {
      const res = await api.post('/profile/verify-email-request');
      if (res.data.success) {
        setVerMsg('Verification request accepted. Delivery requires transactional email to be configured for this environment.');
      } else {
        setVerErr(res.data.message || 'Verification request failed');
      }
    } catch (err: unknown) {
      setVerErr(getErrorMessage(err, 'Request failure'));
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerMsg(null);
    setVerErr(null);
    try {
      const res = await api.post('/profile/verify-email', { token: verificationToken });
      if (res.data.success) {
        setVerMsg('Email verified successfully!');
        updateUser({ emailVerified: true });
        setVerificationToken('');
      } else {
        setVerErr(res.data.message || 'Verification failed');
      }
    } catch (err: unknown) {
      setVerErr(getErrorMessage(err, 'Verification failure'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020E0C] text-white lg:pl-64">
      <CustomerPortalNav current="/security" variant="sidebar" />
      <div className="min-h-screen px-5 pb-12 pt-[104px] sm:px-7 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-[1440px]">
          
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#F8D56B]">Security</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Protect your account.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-emerald-100/65">
            Configure your login credentials, confirm email verification states, and monitor your account status.
          </p>

          {message && (
            <div className="mt-7 p-4 bg-emerald-950/30 border border-emerald-900/40 text-emerald-100 text-sm rounded-2xl flex items-center gap-3">
              <CheckCircle2 size={18} className="text-[#F8D56B]" />
              {message}
            </div>
          )}

          {error && (
            <div className="mt-7 p-4 bg-rose-950/30 border border-rose-900/40 text-rose-100 text-sm rounded-2xl flex items-center gap-3">
              <AlertTriangle size={18} className="text-rose-400" />
              {error}
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            
            {/* Password updating */}
            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]">
                  <KeyRound size={20} />
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold">Change Password</h2>
                  <p className="mt-1 text-xs text-emerald-100/60">Update your account access credentials.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <label className="block text-xs font-bold text-emerald-100/70">
                  Current Password
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </label>

                <label className="block text-xs font-bold text-emerald-100/70">
                  New Password
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading || !oldPassword || !newPassword}
                  className="rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors w-full sm:w-auto mt-2"
                >
                  {loading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </section>

            {/* Email verification guard console */}
            <section className="rounded-[2rem] border border-emerald-100/15 bg-[#061915] p-6 shadow-premium-dark flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-[#D4AF37]/10 p-3 text-[#F8D56B]">
                    <ShieldCheck size={20} />
                  </span>
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

                    <button
                      onClick={handleRequestVerification}
                      disabled={verifying}
                      className="w-full rounded-full border border-emerald-100/20 px-5 py-3 text-sm font-bold text-emerald-100 hover:border-[#D4AF37] disabled:opacity-50 transition-colors"
                    >
                      Request Verification Code
                    </button>

                    {(verMsg || verErr) && (
                      <div className="space-y-4 mt-4">
                        {verMsg && (
                          <div className="p-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-100 text-xs rounded-2xl font-mono whitespace-pre-wrap break-all leading-relaxed">
                            {verMsg}
                          </div>
                        )}
                        {verErr && (
                          <div className="p-4 bg-rose-950/20 border border-rose-900/30 text-rose-100 text-xs rounded-2xl leading-relaxed">
                            {verErr}
                          </div>
                        )}

                        <form onSubmit={handleConfirmVerification} className="space-y-3 pt-2">
                          <input
                            type="text"
                            placeholder="Paste Verification Token here"
                            required
                            value={verificationToken}
                            onChange={(e) => setVerificationToken(e.target.value)}
                            className="w-full rounded-2xl border border-emerald-100/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#D4AF37] transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={verifying || !verificationToken}
                            className="w-full rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#062C23] hover:bg-[#F8D56B] disabled:opacity-50 transition-colors"
                          >
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

          </div>
        </div>
      </div>
    </main>
  );
}
