'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  Phone,
  Mail,
  User,
  X,
  Check,
  Loader2,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';

import type { UserProfile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface OperatorFormData {
  full_name: string;
  email: string;
  contact_number: string;
}

interface OperatorRow {
  id: string;
  email: string;
  full_name: string;
  role: string;
  contact_number: string;
  must_reset_password: boolean;
  created_at: string;
}

const DEFAULT_PASSWORD_LABEL = 'sbrm2026';

const emptyForm: OperatorFormData = {
  full_name: '',
  email: '',
  contact_number: '',
};

export default function UserManagementClient() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [operators, setOperators] = useState<OperatorRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OperatorRow | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<OperatorFormData>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const loadOperators = useCallback(async () => {
    setIsLoadingData(true);
    setApiError(null);

    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, role, contact_number, must_reset_password, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error.message);
      setApiError(error.message);
      setOperators([]);
      setIsLoadingData(false);
      return;
    }

    setOperators((data ?? []) as OperatorRow[]);
    setIsLoadingData(false);
  }, []);

  const getAccessToken = async () => {
    const supabase = createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  };

  useEffect(() => {
    const stored =
      sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');

    if (!stored) {
      router.push('/login-page');
      return;
    }

    try {
      const user: UserProfile = JSON.parse(stored);

      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setCurrentUser(user);
      loadOperators();
    } catch {
      sessionStorage.removeItem('sbr_user');
      localStorage.removeItem('sbr_user');
      router.push('/login-page');
    }
  }, [router, loadOperators]);

  const validate = (): boolean => {
    const errors: Partial<OperatorFormData> = {};

    if (!formData.full_name.trim()) {
      errors.full_name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Enter a valid email';
    }

    if (!formData.contact_number.trim()) {
      errors.contact_number = 'Contact number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setFormErrors({});
    setApiError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: OperatorRow) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      contact_number: user.contact_number,
    });
    setFormErrors({});
    setApiError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;

    setIsModalOpen(false);
    setEditingUser(null);
    setFormData(emptyForm);
    setFormErrors({});
    setApiError(null);
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setApiError(null);

    try {
      const supabase = createClient();

      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name.trim(),
            contact_number: formData.contact_number.trim(),
          })
          .eq('id', editingUser.id);

        if (error) {
          setApiError(error.message);
          setIsSaving(false);
          return;
        }

        await loadOperators();
        showSuccess(`${formData.full_name} updated successfully`);
      } else {
        const token = await getAccessToken();

        if (!token) {
          setApiError('Session expired. Please login again.');
          setIsSaving(false);
          return;
        }

        const res = await fetch('/api/admin/create-operator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            email: formData.email.trim().toLowerCase(),
            contact_number: formData.contact_number.trim(),
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          setApiError(result.error || 'Failed to create operator');
          setIsSaving(false);
          return;
        }

        await loadOperators();

        showSuccess(
          `${formData.full_name} added — default password: ${
            result.defaultPassword || DEFAULT_PASSWORD_LABEL
          }`
        );
      }

      setIsSaving(false);
      closeModal();
    } catch (error) {
      console.error('Save user error:', error);
      setApiError('Something went wrong while saving user.');
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (user: OperatorRow) => {
    const confirmReset = window.confirm(
      `Reset ${user.full_name}'s password to default?\n\nDefault password: ${DEFAULT_PASSWORD_LABEL}\n\nThe user will be required to change password after login.`
    );

    if (!confirmReset) return;

    setResettingId(user.id);
    setApiError(null);

    try {
      const token = await getAccessToken();

      if (!token) {
        setApiError('Session expired. Please login again.');
        setResettingId(null);
        return;
      }

      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setApiError(result.error || 'Failed to reset password');
        setResettingId(null);
        return;
      }

      await loadOperators();

      showSuccess(
        `${user.full_name}'s password was reset to default: ${DEFAULT_PASSWORD_LABEL}`
      );
    } catch (error) {
      console.error('Reset password error:', error);
      setApiError('Something went wrong while resetting password.');
    }

    setResettingId(null);
  };

  const handleDelete = async (user: OperatorRow) => {
    if (currentUser?.id === user.id) {
      setApiError('You cannot delete your own admin account.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${user.full_name}?`
    );

    if (!confirmDelete) return;

    setDeletingId(user.id);
    setApiError(null);

    try {
      const token = await getAccessToken();

      if (!token) {
        setApiError('Session expired. Please login again.');
        setDeletingId(null);
        return;
      }

      const res = await fetch('/api/admin/create-operator', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setApiError(result.error || 'Failed to delete user');
        setDeletingId(null);
        return;
      }

      setOperators((prev) => prev.filter((u) => u.id !== user.id));
      showSuccess(`${user.full_name} removed`);
    } catch (error) {
      console.error('Delete user error:', error);
      setApiError('Something went wrong while deleting user.');
    }

    setDeletingId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) return 'Unknown date';

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`;
  };

  if (!currentUser) return null;

  return (
    <div className="fade-in pb-24">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Users size={16} className="text-primary" aria-hidden="true" />
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              User Management
            </h1>
          </div>

          <p className="text-xs text-muted-foreground">
            Manage operator accounts
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all duration-150"
          aria-label="Add new operator"
        >
          <Plus size={14} aria-hidden="true" />
          Add Operator
        </button>
      </div>

      {/* Admin badge */}
      <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
        <ShieldAlert
          size={14}
          className="text-primary shrink-0"
          aria-hidden="true"
        />
        <p className="text-xs text-primary font-medium">
          Signed in as{' '}
          <span className="font-bold">{currentUser.full_name}</span> — Admin
        </p>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mx-4 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--status-normal-bg)] border border-status-normal/20 fade-in">
          <Check
            size={14}
            className="text-status-normal shrink-0"
            aria-hidden="true"
          />
          <p className="text-xs text-status-normal font-medium">
            {successMsg}
          </p>
        </div>
      )}

      {/* API error */}
      {apiError && !isModalOpen && (
        <div
          className="mx-4 mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20"
          role="alert"
        >
          <AlertTriangle
            size={13}
            className="text-status-critical shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-xs text-status-critical">{apiError}</p>
        </div>
      )}

      {/* Stats bar */}
      <div className="mx-4 mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground font-mono">
            {operators.filter((u) => u.role === 'operator').length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            Operators
          </p>
        </div>

        <div className="rounded-xl bg-secondary border border-border p-3 text-center">
          <p className="text-2xl font-bold text-primary font-mono">
            {operators.filter((u) => u.role === 'admin').length}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
            Admin
          </p>
        </div>
      </div>

      {/* User list */}
      <div className="px-4 space-y-3">
        {isLoadingData ? (
          <div className="flex items-center justify-center py-16">
            <Loader2
              size={24}
              className="animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : operators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
              <Users
                size={24}
                className="text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <p className="text-sm font-semibold text-foreground mb-1">
              No users yet
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your first operator account to get started
            </p>

            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 active:scale-95 transition-all duration-150"
            >
              <Plus size={15} aria-hidden="true" />
              Add Operator
            </button>
          </div>
        ) : (
          operators.map((user) => (
            <div
              key={user.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <User
                      size={18}
                      className="text-accent"
                      aria-hidden="true"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">
                      {user.full_name}
                    </p>

                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent capitalize">
                        {user.role}
                      </span>

                      {user.must_reset_password && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--status-warning-bg)] text-status-warning border border-status-warning/20">
                          <KeyRound size={9} aria-hidden="true" />
                          Default pw
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(user)}
                    disabled={resettingId === user.id}
                    className="w-8 h-8 rounded-lg bg-[var(--status-warning-bg)] border border-status-warning/20 flex items-center justify-center text-status-warning hover:brightness-110 transition-all duration-150 active:scale-95 disabled:opacity-50"
                    aria-label={`Reset password for ${user.full_name}`}
                    title="Reset password to default"
                  >
                    {resettingId === user.id ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <KeyRound size={13} aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(user)}
                    className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-150 active:scale-95"
                    aria-label={`Edit ${user.full_name}`}
                  >
                    <Pencil size={13} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(user)}
                    disabled={deletingId === user.id || currentUser.id === user.id}
                    className="w-8 h-8 rounded-lg bg-[var(--status-critical-bg)] border border-status-critical/20 flex items-center justify-center text-status-critical hover:brightness-110 transition-all duration-150 active:scale-95 disabled:opacity-50"
                    aria-label={`Delete ${user.full_name}`}
                  >
                    {deletingId === user.id ? (
                      <Loader2
                        size={13}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Trash2 size={13} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail
                    size={11}
                    className="text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone
                    size={11}
                    className="text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {user.contact_number || 'No contact number'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground/60">
                  Added {formatDate(user.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="h-24" />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={editingUser ? 'Edit operator' : 'Add operator'}
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-card border-t border-border rounded-t-3xl px-5 pt-5 pb-8 z-10">
            <div
              className="w-10 h-1 rounded-full bg-border mx-auto mb-5"
              aria-hidden="true"
            />

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {editingUser ? 'Edit Operator' : 'Add Operator'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingUser
                    ? 'Update operator account details'
                    : `New account — default password: ${DEFAULT_PASSWORD_LABEL}`}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Close modal"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            {/* API error */}
            {apiError && (
              <div
                className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/20"
                role="alert"
              >
                <AlertTriangle
                  size={13}
                  className="text-status-critical shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs text-status-critical">{apiError}</p>
              </div>
            )}

            {/* Default password notice for new accounts */}
            {!editingUser && (
              <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <KeyRound
                  size={13}
                  className="text-primary shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <p className="text-xs text-primary">
                  The operator will log in with default password{' '}
                  <span className="font-bold font-mono">
                    {DEFAULT_PASSWORD_LABEL}
                  </span>{' '}
                  and will be required to set a new password on first login.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="um-name"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="um-name"
                  type="text"
                  placeholder="e.g. Maria Santos"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      full_name: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-secondary border transition-all duration-150 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 ${
                    formErrors.full_name
                      ? 'border-status-critical/50'
                      : 'border-border'
                  }`}
                  aria-invalid={!!formErrors.full_name}
                />
                {formErrors.full_name && (
                  <p className="mt-1.5 text-xs text-status-critical flex items-center gap-1">
                    <AlertTriangle size={11} aria-hidden="true" />
                    {formErrors.full_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="um-email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="um-email"
                  type="email"
                  placeholder="operator@sbr-monitor.ph"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  disabled={!!editingUser}
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-secondary border transition-all duration-150 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.email
                      ? 'border-status-critical/50'
                      : 'border-border'
                  }`}
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <p className="mt-1.5 text-xs text-status-critical flex items-center gap-1">
                    <AlertTriangle size={11} aria-hidden="true" />
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Contact Number */}
              <div>
                <label
                  htmlFor="um-contact"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Contact Number
                </label>
                <input
                  id="um-contact"
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={formData.contact_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_number: e.target.value,
                    }))
                  }
                  className={`w-full px-4 py-3 rounded-xl text-sm bg-secondary border transition-all duration-150 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 ${
                    formErrors.contact_number
                      ? 'border-status-critical/50'
                      : 'border-border'
                  }`}
                  aria-invalid={!!formErrors.contact_number}
                />
                {formErrors.contact_number && (
                  <p className="mt-1.5 text-xs text-status-critical flex items-center gap-1">
                    <AlertTriangle size={11} aria-hidden="true" />
                    {formErrors.contact_number}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-secondary border border-border text-muted-foreground hover:text-foreground transition-all duration-150 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition-all duration-150 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        size={14}
                        className="animate-spin"
                        aria-hidden="true"
                      />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check size={14} aria-hidden="true" />
                      {editingUser ? 'Save Changes' : 'Add Operator'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
