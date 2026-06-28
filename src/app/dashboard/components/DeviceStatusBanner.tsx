'use client';

import React, { useMemo } from 'react';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import type { DeviceConnectionStatus } from '@/types';

interface DeviceStatusBannerProps {
  status: DeviceConnectionStatus;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function formatLastUpdated(lastUpdated: string) {
  if (!lastUpdated) return 'No data yet';

  const date = new Date(lastUpdated);

  if (Number.isNaN(date.getTime())) {
    return lastUpdated;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function DeviceStatusBanner({
  status,
  lastUpdated,
  onRefresh,
  isRefreshing,
}: DeviceStatusBannerProps) {
  const displayTime = useMemo(
    () => formatLastUpdated(lastUpdated),
    [lastUpdated]
  );

  const configs: Record<
    DeviceConnectionStatus,
    {
      icon: React.ElementType;
      text: string;
      subtext: string;
      bgClass: string;
      textClass: string;
      borderClass: string;
      dotClass: string;
      pulse: boolean;
    }
  > = {
    connected: {
      icon: Wifi,
      text: 'Device Connected',
      subtext: 'SBR Controller • Receiving live data',
      bgClass: 'bg-[var(--status-normal-bg)]',
      textClass: 'text-status-normal',
      borderClass: 'border-status-normal/20',
      dotClass: 'bg-status-normal',
      pulse: true,
    },
    unstable: {
      icon: AlertTriangle,
      text: 'Connection Unstable',
      subtext: 'Intermittent signal — data may be delayed',
      bgClass: 'bg-[var(--status-warning-bg)]',
      textClass: 'text-status-warning',
      borderClass: 'border-status-warning/20',
      dotClass: 'bg-status-warning',
      pulse: true,
    },
    disconnected: {
      icon: WifiOff,
      text: 'Device Offline',
      subtext: 'Cannot reach SBR controller — check network',
      bgClass: 'bg-[var(--status-critical-bg)]',
      textClass: 'text-status-critical',
      borderClass: 'border-status-critical/20',
      dotClass: 'bg-status-critical',
      pulse: false,
    },
  };

  const cfg = configs[status];
  const StatusIcon = cfg.icon;

  return (
    <div
      className={`mx-4 mt-4 rounded-xl border px-4 py-3 flex items-center gap-3 ${cfg.bgClass} ${cfg.borderClass}`}
      role="status"
      aria-live="polite"
    >
      <div className="relative shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full block ${cfg.dotClass} ${
            cfg.pulse ? 'live-pulse' : ''
          }`}
          aria-hidden="true"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <StatusIcon
            size={13}
            className={cfg.textClass}
            aria-hidden="true"
          />

          <span className={`text-xs font-semibold ${cfg.textClass}`}>
            {cfg.text}
          </span>
        </div>

        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          {cfg.subtext}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-mono">
          {displayTime}
        </span>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95 disabled:opacity-40"
          aria-label="Refresh sensor data"
        >
          <RefreshCw
            size={13}
            className={isRefreshing ? 'animate-spin' : ''}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}