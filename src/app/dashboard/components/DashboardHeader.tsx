'use client';

import React, { useState, useEffect } from 'react';
import { Bell, UserCircle2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardHeaderProps {
  alertCount: number;
}

export default function DashboardHeader({ alertCount }: DashboardHeaderProps) {
  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('Operator');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    setDateStr(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);

    // BACKEND INTEGRATION POINT: Read user profile from session/Zustand store
    try {
      const stored = sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');
      if (stored) {
        const user = JSON.parse(stored);
        const firstName = (user.full_name || '').split(' ')[0];
        if (firstName) setUserName(firstName);
      }
    } catch {
      // fallback to default
    }
  }, []);

  return (
    <div className="px-4 pt-5 pb-2 flex items-start justify-between">
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{dateStr}</p>
        <h1 className="text-xl font-bold text-foreground tracking-tight">
          {greeting}{userName !== 'Operator' ? `, ${userName}` : ''}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">SBR Plant Monitoring Dashboard</p>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <Link
          href="/alerts-page"
          className="relative p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors active:scale-95"
          aria-label={alertCount > 0 ? `${alertCount} unacknowledged alerts` : 'No active alerts'}
        >
          <Bell size={18} className={alertCount > 0 ? 'text-status-warning' : 'text-muted-foreground'} aria-hidden="true" />
          {alertCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-status-critical text-white text-[10px] font-bold flex items-center justify-center"
              aria-hidden="true"
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors active:scale-95"
          aria-label="Profile settings"
        >
          <UserCircle2 size={18} className="text-muted-foreground" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}