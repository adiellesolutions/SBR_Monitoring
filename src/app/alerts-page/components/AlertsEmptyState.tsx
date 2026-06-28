import React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { AlertFilter } from './AlertFilterTabs';

interface AlertsEmptyStateProps {
  filter: AlertFilter;
}

const MESSAGES: Record<AlertFilter, { title: string; description: string }> = {
  all: {
    title: 'No alerts recorded',
    description:
      'The SBR system has not generated any alerts. All sensors are reporting within normal parameters.',
  },
  active: {
    title: 'No active alerts',
    description:
      'All current alerts have been acknowledged. The plant is operating normally.',
  },
  critical: {
    title: 'No critical alerts',
    description:
      'No critical-severity alerts are active. Sensor readings are within safe operating limits.',
  },
  acknowledged: {
    title: 'No acknowledged alerts',
    description:
      'There are no acknowledged alerts recorded yet.',
  },
};

export default function AlertsEmptyState({ filter }: AlertsEmptyStateProps) {
  const msg = MESSAGES[filter] ?? MESSAGES.all;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[var(--status-normal-bg)] border border-status-normal/20 flex items-center justify-center mb-4">
        <ShieldCheck
          size={28}
          className="text-status-normal"
          aria-hidden="true"
        />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-2">
        {msg.title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {msg.description}
      </p>
    </div>
  );
}