'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft, Mail, KeyRound, ShieldCheck } from 'lucide-react';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 rounded-xl text-sm bg-secondary border transition-all duration-150
    text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50
    ${hasError ? 'border-status-critical/50 focus:ring-status-critical/20' : 'border-border hover:border-muted-foreground/30'}`;

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send code. Try again.');
      } else {
        setStep('otp');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError('Enter the 6-digit code sent to your email');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid or expired code.');
      } else {
        setStep('newPassword');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Set New Password ──────────────────────────────────────────────
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setStep('success');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Back link */}
      <Link
        href="/login-page"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
        Back to sign in
      </Link>

      {/* ── SUCCESS ── */}
      {step === 'success' && (
        <div className="rounded-xl border border-status-normal/20 bg-[var(--status-normal-bg)] p-5 fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-status-normal shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-status-normal">Password reset successfully!</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
          </div>
          <Link
            href="/login-page"
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 flex items-center justify-center"
          >
            Return to sign in
          </Link>
        </div>
      )}

      {/* ── STEP 1: EMAIL ── */}
      {step === 'email' && (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Mail size={22} className="text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Enter your account email and we&apos;ll send a 6-digit reset code to your inbox.
            </p>
          </div>

          <form onSubmit={handleSendOtp} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20 fade-in" role="alert">
                <AlertTriangle size={15} className="text-status-critical shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-status-critical">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="fp-email" className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                id="fp-email"
                type="email"
                autoComplete="email"
                placeholder="operator@sbr-monitor.ph"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                className={inputClass(!!error)}
                aria-invalid={!!error}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '48px' }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" aria-hidden="true" /><span>Sending code…</span></>
              ) : 'Send reset code'}
            </button>
            <p className="text-center text-xs text-muted-foreground pt-1">
              Remember your password?{' '}
              <Link href="/login-page" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </>
      )}

      {/* ── STEP 2: OTP ── */}
      {step === 'otp' && (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <KeyRound size={22} className="text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Enter reset code</h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Check your inbox (and spam folder).
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20 fade-in" role="alert">
                <AlertTriangle size={15} className="text-status-critical shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-status-critical">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="fp-otp" className="block text-sm font-medium text-foreground mb-1.5">6-digit code</label>
              <input
                id="fp-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
                className={`${inputClass(!!error)} text-center text-2xl font-mono tracking-[0.5em]`}
                aria-invalid={!!error}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '48px' }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" aria-hidden="true" /><span>Verifying…</span></>
              ) : 'Verify code'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null); }}
              className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Use a different email
            </button>
          </form>
        </>
      )}

      {/* ── STEP 3: NEW PASSWORD ── */}
      {step === 'newPassword' && (
        <>
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <ShieldCheck size={22} className="text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Set new password</h1>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Code verified! Choose a strong new password for your account.
            </p>
          </div>

          <form onSubmit={handleSetPassword} noValidate className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20 fade-in" role="alert">
                <AlertTriangle size={15} className="text-status-critical shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-status-critical">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="fp-newpw" className="block text-sm font-medium text-foreground mb-1.5">New password</label>
              <input
                id="fp-newpw"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                className={inputClass(!!error)}
              />
            </div>
            <div>
              <label htmlFor="fp-confirmpw" className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
              <input
                id="fp-confirmpw"
                type="password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                className={inputClass(!!error)}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ minHeight: '48px' }}
            >
              {isLoading ? (
                <><Loader2 size={16} className="animate-spin" aria-hidden="true" /><span>Updating password…</span></>
              ) : 'Set new password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
