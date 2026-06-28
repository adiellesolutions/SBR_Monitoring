import React from 'react';
import AppLayout from '@/components/AppLayout';
import AlertsClient from './components/AlertsClient';
import { MOCK_ALERTS } from '@/utils/mockData';

export const metadata = {
  title: 'Alerts — SBR Monitor',
};

export default function AlertsPage() {
  const unacknowledgedCount = MOCK_ALERTS?.filter((a) => !a?.acknowledged)?.length;

  return (
    <AppLayout alertCount={unacknowledgedCount}>
      <AlertsClient initialAlerts={MOCK_ALERTS} />
    </AppLayout>
  );
}