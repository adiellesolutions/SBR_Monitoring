'use client';

import React, { useEffect, useRef } from 'react';
import type { SensorStatus } from '@/types';
import { statusBg, statusColor, statusGlow } from '@/utils/sensorUtils';

interface SensorMetricCardProps {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  status: SensorStatus;
  icon: React.ReactNode;
  sublabel?: string;
}

export default function SensorMetricCard({
  id,
  label,
  value,
  unit,
  status,
  icon,
  sublabel,
}: SensorMetricCardProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const prevRef = useRef<string | number | undefined>(undefined);

  useEffect(() => {
    if (
      prevRef.current !== undefined &&
      prevRef.current !== value &&
      valueRef.current
    ) {
      valueRef.current.classList.remove('value-flash');
      void valueRef.current.offsetWidth;
      valueRef.current.classList.add('value-flash');
    }

    prevRef.current = value;
  }, [value]);

  const statusDotColor: Record<SensorStatus, string> = {
    normal: 'bg-status-normal',
    warning: 'bg-status-warning',
    critical: 'bg-status-critical',
    offline: 'bg-status-offline',
  };

  const statusLabelColor: Record<SensorStatus, string> = {
    normal: 'text-status-normal',
    warning: 'text-status-warning',
    critical: 'text-status-critical',
    offline: 'text-status-offline',
  };

  const statusLabel: Record<SensorStatus, string> = {
    normal: 'Normal',
    warning: 'Warning',
    critical: 'Critical',
    offline: 'Offline',
  };

  return (
    <div
      id={id}
      className={`
        rounded-xl p-4 border border-border/50 bg-card
        transition-all duration-300 cursor-default
        ${statusGlow(status)}
        hover:border-border
      `}
      aria-label={`${label}: ${value}${unit}, status ${statusLabel[status]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center
            ${statusBg(status)}
          `}
          aria-hidden="true"
        >
          <span className={statusColor(status)}>{icon}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              statusDotColor[status]
            } ${status === 'critical' ? 'live-pulse' : ''}`}
            aria-hidden="true"
          />

          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${statusLabelColor[status]}`}
          >
            {statusLabel[status]}
          </span>
        </div>
      </div>

      <div className="mb-0.5">
        <span
          ref={valueRef}
          className="text-value-xl text-foreground font-mono rounded-md px-0.5"
        >
          {value}
        </span>

        {unit && (
          <span className="text-sm text-muted-foreground ml-1 font-medium">
            {unit}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-muted-foreground tracking-wide">
        {label}
      </p>

      {sublabel && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {sublabel}
        </p>
      )}
    </div>
  );
}