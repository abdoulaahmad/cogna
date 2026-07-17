'use client';

import React, { useState } from 'react';
import { getErrorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import {
  Key,
  Shield,  AlertTriangle,
  CheckCircle,} from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-display">
      
      {/* Upper Navigation Header */}
      <CustomerPortalNav current="/security" />

      <div className="max-w-4xl mx-auto p-8 space-y-8">
        
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Password & Security</h1>
          <p className="text-xs text-slate-400 mt-1">Configure your login credentials, confirm email verification states, and update secret parameters.</p>
        </div>

        {message && (
          <div className="p-4 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle size={16} />
            {message}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-950/20 border border-red-900/40 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Password updating */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
              <Key size={16} className="text-emerald-400" />
              Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          </div>

          {/* Email verification guard console */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" />
                Email Verification
              </h3>

              {user?.emailVerified ? (
                <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Your email address <strong>{user?.email}</strong> is fully verified.</span>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-400 text-xs flex items-center gap-2">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>Your email is not verified. Please request verification.</span>
                  </div>

                  <button
                    onClick={handleRequestVerification}
                    disabled={verifying}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg border border-slate-700 transition"
                  >
                    Request Verification Code
                  </button>

                  {(verMsg || verErr) && (
                    <div className="space-y-4">
                      {verMsg && (
                        <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-lg font-mono whitespace-pre-wrap break-all">
                          {verMsg}
                        </div>
                      )}
                      {verErr && (
                        <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-lg">
                          {verErr}
                        </div>
                      )}

                      <form onSubmit={handleConfirmVerification} className="space-y-2">
                        <input
                          type="text"
                          placeholder="Paste Raw Token code here"
                          required
                          value={verificationToken}
                          onChange={(e) => setVerificationToken(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 transition text-slate-300"
                        />
                        <button
                          type="submit"
                          disabled={verifying}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg transition"
                        >
                          Confirm Code
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-4 mt-6">
              Account status: <span className="font-bold text-emerald-400">{user?.status}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
