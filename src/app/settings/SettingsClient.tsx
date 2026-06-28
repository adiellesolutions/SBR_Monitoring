'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Smartphone,
  LogOut,
  User,
  Mail,
  ShieldAlert,
  Loader2,
  X,
  AlertTriangle,
} from 'lucide-react';

import type { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import BottomNav from '@/components/BottomNav';

const APK_VERSION = process.env.NEXT_PUBLIC_APK_VERSION || '1.0.0';

export default function SettingsClient() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    const stored =
      sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');

    if (!stored) {
      router.push('/login-page');
      return;
    }

    try {
      const user: UserProfile = JSON.parse(stored);
      setCurrentUser(user);
    } catch {
      sessionStorage.removeItem('sbr_user');
      localStorage.removeItem('sbr_user');
      router.push('/login-page');
      return;
    }

    setIsLoading(false);
  }, [router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        setLogoutError(error.message);
        setIsLoggingOut(false);
        return;
      }

      sessionStorage.removeItem('sbr_user');
      localStorage.removeItem('sbr_user');

      router.replace('/login-page');
      router.refresh();
    } catch {
      setLogoutError('Something went wrong while logging out.');
      setIsLoggingOut(false);
    }
  };

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={26} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="fade-in pb-24">
        {/* Header */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-0.5">
            <Settings size={16} className="text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Settings
            </h1>
          </div>

          <p className="text-xs text-muted-foreground">
            Manage your account and app information
          </p>
        </div>

        {/* Account card */}
        <div className="mx-4 mb-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <User size={20} className="text-primary" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentUser.full_name}
              </p>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent capitalize">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {currentUser.email && (
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">
                  {currentUser.email}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <ShieldAlert
                size={12}
                className="text-muted-foreground shrink-0"
              />
              <span className="text-xs text-muted-foreground capitalize">
                Signed in as {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* App information */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Application
          </p>

          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Smartphone size={18} className="text-primary" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    APK Version
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current installed version
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                v{APK_VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* Logout section */}
        <div className="mx-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Account
          </p>

          <button
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full rounded-2xl border border-status-critical/20 bg-[var(--status-critical-bg)] p-4 flex items-center justify-between active:scale-[0.98] transition-all duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-status-critical/10 border border-status-critical/20 flex items-center justify-center">
                <LogOut size={18} className="text-status-critical" />
              </div>

              <div className="text-left">
                <p className="text-sm font-semibold text-status-critical">
                  Logout
                </p>
                <p className="text-xs text-status-critical/80">
                  Sign out from your account
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Extra space so content is not hidden behind BottomNav */}
        <div className="h-24" />
      </div>

      {/* Bottom nav must be outside fade-in wrapper */}
      <BottomNav />

      {/* Logout confirmation modal */}
      {isLogoutModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm logout"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isLoggingOut) setIsLogoutModalOpen(false);
            }}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-3xl px-5 pt-5 pb-8 z-10">
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Logout Account
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Are you sure you want to logout?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
                className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            {logoutError && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20">
                <AlertTriangle
                  size={13}
                  className="text-status-critical shrink-0 mt-0.5"
                />
                <p className="text-xs text-status-critical">{logoutError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                disabled={isLoggingOut}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex-1 py-3 rounded-xl text-sm font-semibold bg-status-critical text-white hover:brightness-110 transition-all duration-150 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}