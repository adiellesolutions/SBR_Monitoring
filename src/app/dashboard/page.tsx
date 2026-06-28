import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardClient from './components/DashboardClient';
import { MOCK_ALERTS } from '@/utils/mockData';

export const metadata = {
  title: 'Dashboard — SBR Monitor',
};

export default function DashboardPage() {
  const alertCount = MOCK_ALERTS?.filter((a) => !a?.acknowledged)?.length ?? 0;

  return (
    <AppLayout alertCount={alertCount}>
      <DashboardClient />
    </AppLayout>
  );
}