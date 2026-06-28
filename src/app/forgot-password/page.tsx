import React from 'react';
import ForgotPasswordForm from './components/ForgotPasswordForm';

export const metadata = {
  title: 'Forgot Password — SBR Monitor',
};

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--background)' }}
    >
      <ForgotPasswordForm />
    </div>
  );
}
