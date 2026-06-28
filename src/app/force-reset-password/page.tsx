'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { UserProfile } from '@/types';

export default function ForceResetPasswordPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored =
      sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');
    if (!stored) {
      router.push('/login-page');
      return;
    }
    const user: UserProfile = JSON.parse(stored);
    setCurrentUser(user);
  }, [router]);

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 pr-11 rounded-xl text-sm bg-secondary border transition-all duration-150
    text-foreground placeholder:text-muted-foreground
    focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50
    ${hasError ? 'border-status-critical/50 focus:ring-status-critical/20' : 'border-border hover:border-muted-foreground/30'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword === 'sbrm2026') {
      setError('You cannot reuse the default password. Please choose a new one.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update password via Supabase auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }

      // Clear must_reset_password flag in profiles table
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ must_reset_password: false })
          .eq('id', currentUser.id);

        // Update stored session
        const updatedUser = { ...currentUser, must_reset_password: false };
        const inLocal = !!localStorage.getItem('sbr_user');
        if (inLocal) {
          localStorage.setItem('sbr_user', JSON.stringify(updatedUser));
        } else {
          sessionStorage.setItem('sbr_user', JSON.stringify(updatedUser));
        }
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <div className="w-full max-w-sm mx-auto">
        {/* Icon + Title */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <ShieldCheck size={22} className="text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            Welcome, <span className="font-medium text-foreground">{currentUser.full_name}</span>! Your account was created with a default password. Please set a new password to continue.
          </p>
        </div>

        {/* Warning banner */}
        <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-warning-bg)] border border-status-warning/20">
          <AlertTriangle size={15} className="text-status-warning shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-status-warning">You must set a new password before accessing the app.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20 fade-in" role="alert">
            <AlertTriangle size={15} className="text-status-critical shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-status-critical">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* New Password */}
          <div>
            <label htmlFor="fr-newpw" className="block text-sm font-medium text-foreground mb-1.5">New password</label>
            <div className="relative">
              <input
                id="fr-newpw"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                className={inputClass(!!error)}
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="fr-confirmpw" className="block text-sm font-medium text-foreground mb-1.5">Confirm password</label>
            <div className="relative">
              <input
                id="fr-confirmpw"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                className={inputClass(!!error)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ minHeight: '48px' }}
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin" aria-hidden="true" /><span>Updating password…</span></>
            ) : 'Set new password & continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
