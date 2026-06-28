'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
}

type LoginUserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator';
  contact_number: string;
  must_reset_password: boolean;
};

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState(
    'Authentication successful. Redirecting...'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    setLoginSuccess(false);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });

      if (error || !authData.user) {
        setIsLoading(false);
        setAuthError('Invalid email or password. Please try again.');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, role, contact_number, must_reset_password'
        )
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError.message);
      }

      const metadata = authData.user.user_metadata;

      const userProfile: LoginUserProfile = {
        id: profile?.id ?? authData.user.id,
        email: profile?.email ?? authData.user.email ?? '',
        full_name: profile?.full_name ?? metadata?.full_name ?? '',
        role: (profile?.role ?? metadata?.role ?? 'operator') as
          | 'admin'
          | 'operator',
        contact_number:
          profile?.contact_number ?? metadata?.contact_number ?? '',
        must_reset_password:
          profile?.must_reset_password ??
          metadata?.must_reset_password ??
          false,
      };

      // avoid duplicate old login data
      sessionStorage.removeItem('sbr_user');
      localStorage.removeItem('sbr_user');

      const storage = data.remember ? localStorage : sessionStorage;
      storage.setItem('sbr_user', JSON.stringify(userProfile));

      setLoginSuccess(true);
      setIsLoading(false);

      if (userProfile.must_reset_password) {
        setRedirectMessage(
          'Login successful. Please change your default password...'
        );

        setTimeout(() => {
          router.replace('/change-password');
        }, 700);

        return;
      }

      if (userProfile.role === 'admin') {
        setRedirectMessage('Authentication successful. Redirecting to admin...');
        setTimeout(() => {
          router.replace('/admin');
        }, 700);
        return;
      }

      setRedirectMessage('Authentication successful. Redirecting to dashboard...');
      setTimeout(() => {
        router.replace('/dashboard');
      }, 700);
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      setAuthError('Something went wrong while signing in.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-8 text-center lg:hidden">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="8"
              y="4"
              width="12"
              height="20"
              rx="2"
              stroke="var(--primary)"
              strokeWidth="1.8"
              fill="none"
            />
            <line
              x1="8"
              y1="10"
              x2="20"
              y2="10"
              stroke="var(--primary)"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <line
              x1="8"
              y1="14"
              x2="20"
              y2="14"
              stroke="var(--primary)"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <line
              x1="8"
              y1="18"
              x2="20"
              y2="18"
              stroke="var(--primary)"
              strokeWidth="1.2"
              opacity="0.6"
            />
            <circle cx="14" cy="4" r="2" fill="var(--accent)" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-foreground tracking-tight">
          SBR Monitor
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sewage Treatment Plant Control
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Sign in
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Access your plant monitoring dashboard
        </p>
      </div>

      {loginSuccess && (
        <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-[var(--status-normal-bg)] border border-status-normal/20 fade-in">
          <CheckCircle2
            size={16}
            className="text-status-normal shrink-0"
            aria-hidden="true"
          />
          <p className="text-sm text-status-normal font-medium">
            {redirectMessage}
          </p>
        </div>
      )}

      {authError && !loginSuccess && (
        <div
          className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20 fade-in"
          role="alert"
        >
          <AlertTriangle
            size={16}
            className="text-status-critical shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-sm text-status-critical">{authError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Email address
          </label>

          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="operator@sbr-monitor.ph"
            className={`
              w-full px-4 py-3 rounded-xl text-sm bg-secondary border transition-all duration-150
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50
              ${
                errors.email
                  ? 'border-status-critical/50 focus:ring-status-critical/20'
                  : 'border-border hover:border-muted-foreground/30'
              }
            `}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
          />

          {errors.email && (
            <p
              id="email-error"
              className="mt-1.5 text-xs text-status-critical flex items-center gap-1"
              role="alert"
            >
              <AlertTriangle size={11} aria-hidden="true" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Password
          </label>

          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`
                w-full px-4 py-3 pr-11 rounded-xl text-sm bg-secondary border transition-all duration-150
                text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50
                ${
                  errors.password
                    ? 'border-status-critical/50 focus:ring-status-critical/20'
                    : 'border-border hover:border-muted-foreground/30'
                }
              `}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              aria-describedby={errors.password ? 'password-error' : undefined}
              aria-invalid={!!errors.password}
            />

            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={16} aria-hidden="true" />
              ) : (
                <Eye size={16} aria-hidden="true" />
              )}
            </button>
          </div>

          {errors.password && (
            <p
              id="password-error"
              className="mt-1.5 text-xs text-status-critical flex items-center gap-1"
              role="alert"
            >
              <AlertTriangle size={11} aria-hidden="true" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 rounded accent-primary bg-secondary border-border cursor-pointer"
              {...register('remember')}
            />

            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Keep me signed in
            </label>
          </div>

          <span className="text-sm text-muted-foreground font-medium shrink-0">
            Contact admin
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading || loginSuccess}
          className="
            w-full py-3 rounded-xl font-semibold text-sm
            bg-primary text-primary-foreground
            hover:brightness-110 active:scale-[0.98]
            transition-all duration-150
            disabled:opacity-60 disabled:cursor-not-allowed
            flex items-center justify-center gap-2
          "
          style={{ minHeight: '48px' }}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              <span>Authenticating...</span>
            </>
          ) : loginSuccess ? (
            <>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Success</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Having trouble?{' '}
        <span className="text-primary cursor-pointer hover:underline">
          Contact your administrator
        </span>
      </p>
    </div>
  );
}