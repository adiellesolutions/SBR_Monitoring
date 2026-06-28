import React from 'react';
import AppLayout from '@/components/AppLayout';
import UserManagementClient from './components/UserManagementClient';

export default function AdminPage() {
  return (
    <AppLayout>
      <UserManagementClient />
    </AppLayout>
  );
}
