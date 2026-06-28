'use client';

import React from 'react';
import type { SensorReading, SensorStatus } from '@/types';
import {
  getVoltageStatus,
  getCurrentStatus,
  getTemperatureStatus,
  getWaterLevelStatus,
} from '@/utils/sensorUtils';

interface QuickStatsBarProps {
  reading: SensorReading;
}

export default function QuickStatsBar({ reading }: QuickStatsBarProps) {
  const voltage = reading.voltage ?? 0;
  const current = reading.current ?? 0;
  const temperature = reading.temperature ?? 0;
  const waterLevel = reading.water_level ?? 0;

  const systemState = (reading as any).state ?? 'NORMAL';

  const stateStatus: SensorStatus =
    systemState === 'WARNING'
      ? 'warning'
      : systemState === 'WATER'
        ? 'normal'
        : 'normal';

  const allStatuses: SensorStatus[] = [
    getVoltageStatus(voltage),
    getCurrentStatus(current),
    getTemperatureStatus(temperature),
    getWaterLevelStatus(waterLevel),
    stateStatus,
  ];

  const totalSensors = allStatuses.length;

  const criticalCount = allStatuses.filter((s) => s === 'critical').length;
  const warningCount = allStatuses.filter((s) => s === 'warning').length;
  const normalCount = allStatuses.filter((s) => s === 'normal').length;

  const overallOk = criticalCount === 0 && warningCount === 0;

  return (
    <div className="mx-4 mt-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Sensor Health Overview
        </span>

        {overallOk ? (
          <span className="text-[11px] font-medium text-status-normal">
            All systems nominal
          </span>
        ) : (
          <span
            className={`text-[11px] font-medium ${
              criticalCount > 0 ? 'text-status-critical' : 'text-status-warning'
            }`}
          >
            {criticalCount > 0
              ? `${criticalCount} critical`
              : `${warningCount} warning`}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-[var(--status-normal-bg)] px-3 py-2 text-center">
          <p className="text-lg font-bold text-status-normal font-mono">
            {normalCount}
          </p>
          <p className="text-[10px] text-status-normal/70 font-medium">
            Normal
          </p>
        </div>

        <div
          className={`flex-1 rounded-lg px-3 py-2 text-center ${
            warningCount > 0
              ? 'bg-[var(--status-warning-bg)]'
              : 'bg-secondary/50'
          }`}
        >
          <p
            className={`text-lg font-bold font-mono ${
              warningCount > 0 ? 'text-status-warning' : 'text-muted-foreground'
            }`}
          >
            {warningCount}
          </p>
          <p
            className={`text-[10px] font-medium ${
              warningCount > 0
                ? 'text-status-warning/70'
                : 'text-muted-foreground/60'
            }`}
          >
            Warning
          </p>
        </div>

        <div
          className={`flex-1 rounded-lg px-3 py-2 text-center ${
            criticalCount > 0
              ? 'bg-[var(--status-critical-bg)]'
              : 'bg-secondary/50'
          }`}
        >
          <p
            className={`text-lg font-bold font-mono ${
              criticalCount > 0 ? 'text-status-critical' : 'text-muted-foreground'
            }`}
          >
            {criticalCount}
          </p>
          <p
            className={`text-[10px] font-medium ${
              criticalCount > 0
                ? 'text-status-critical/70'
                : 'text-muted-foreground/60'
            }`}
          >
            Critical
          </p>
        </div>
      </div>

      <div className="mt-3 h-1.5 rounded-full overflow-hidden flex gap-0.5">
        {normalCount > 0 && (
          <div
            className="h-full rounded-full bg-status-normal transition-all duration-700"
            style={{ width: `${(normalCount / totalSensors) * 100}%` }}
            aria-hidden="true"
          />
        )}

        {warningCount > 0 && (
          <div
            className="h-full rounded-full bg-status-warning transition-all duration-700"
            style={{ width: `${(warningCount / totalSensors) * 100}%` }}
            aria-hidden="true"
          />
        )}

        {criticalCount > 0 && (
          <div
            className="h-full rounded-full bg-status-critical transition-all duration-700"
            style={{ width: `${(criticalCount / totalSensors) * 100}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}