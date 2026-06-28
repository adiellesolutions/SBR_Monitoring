import React from 'react';
import type { SensorStatus } from '@/types';

interface StatusBadgeProps {
  status: SensorStatus;
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<SensorStatus, { label: string; dotClass: string; textClass: string; bgClass: string }> = {
  normal: {
    label: 'Normal',
    dotClass: 'bg-status-normal',
    textClass: 'text-status-normal',
    bgClass: 'bg-[var(--status-normal-bg)]',
  },
  warning: {
    label: 'Warning',
    dotClass: 'bg-status-warning',
    textClass: 'text-status-warning',
    bgClass: 'bg-[var(--status-warning-bg)]',
  },
  critical: {
    label: 'Critical',
    dotClass: 'bg-status-critical',
    textClass: 'text-status-critical',
    bgClass: 'bg-[var(--status-critical-bg)]',
  },
  offline: {
    label: 'Offline',
    dotClass: 'bg-status-offline',
    textClass: 'text-status-offline',
    bgClass: 'bg-[var(--status-offline-bg)]',
  },
};

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  const displayLabel = label ?? cfg.label;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${cfg.bgClass} ${cfg.textClass}
        ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
      `}
    >
      <span
        className={`rounded-full shrink-0 ${cfg.dotClass} ${size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'}`}
        aria-hidden="true"
      />
      {displayLabel}
    </span>
  );
}