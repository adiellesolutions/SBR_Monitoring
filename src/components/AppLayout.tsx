import React from 'react';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  alertCount?: number;
}

export default function AppLayout({ children, alertCount = 0 }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--background)' }}>
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav alertCount={alertCount} />
    </div>
  );
}