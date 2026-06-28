import React from 'react';
import type { AlertSeverity } from '@/types';

interface SeverityBadgeProps {
  severity: AlertSeverity;
}

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
  info: {
    label: 'Info',
    textClass: 'text-severity-info',
    bgClass: 'bg-[var(--severity-info-bg)]',
    borderClass: 'border-severity-info',
  },
  warning: {
    label: 'Warning',
    textClass: 'text-severity-warning',
    bgClass: 'bg-[var(--severity-warning-bg)]',
    borderClass: 'border-severity-warning',
  },
  critical: {
    label: 'Critical',
    textClass: 'text-severity-critical',
    bgClass: 'bg-[var(--severity-critical-bg)]',
    borderClass: 'border-severity-critical',
  },
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide
        border ${cfg.bgClass} ${cfg.textClass} ${cfg.borderClass} border-opacity-30
      `}
    >
      {cfg.label}
    </span>
  );
}