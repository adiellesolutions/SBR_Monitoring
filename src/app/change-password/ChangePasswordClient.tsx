'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ChangePasswordClient() {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMsg(null);
    setSuccessMsg(null);

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsUpdating(true);

    try {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setErrorMsg('Session expired. Please login again.');
        setIsUpdating(false);
        return;
      }

      const res = await fetch('/api/auth/change-default-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          newPassword,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setErrorMsg(result.error || 'Failed to update password.');
        setIsUpdating(false);
        return;
      }

      const stored =
        sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');

      if (stored) {
        const user = JSON.parse(stored);

        const updatedUser = {
          ...user,
          must_reset_password: false,
        };

        sessionStorage.setItem('sbr_user', JSON.stringify(updatedUser));
        localStorage.setItem('sbr_user', JSON.stringify(updatedUser));
      }

      setSuccessMsg('Password updated successfully. Redirecting...');

      setTimeout(() => {
        router.replace('/dashboard');
        router.refresh();
      }, 1200);
    } catch (error) {
      console.error('Change password error:', error);
      setErrorMsg('Something went wrong while updating your password.');
    }

    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleUpdatePassword}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5"
      >
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
          <KeyRound size={22} className="text-primary" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-1">
          Change Password
        </h1>

        <p className="text-sm text-muted-foreground mb-5">
          You are using a default password. Please set a new password before
          continuing.
        </p>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-status-critical/20 bg-[var(--status-critical-bg)] p-3 text-xs text-status-critical">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-status-normal/20 bg-[var(--status-normal-bg)] p-3 text-xs text-status-normal">
            <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/50"
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isUpdating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </button>
      </form>
    </div>
  );
}