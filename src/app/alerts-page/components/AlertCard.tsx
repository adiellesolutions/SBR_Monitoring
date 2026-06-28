'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Info,
  XCircle,
} from 'lucide-react';
import type { Alert } from '@/types';
import SeverityBadge from '@/components/ui/SeverityBadge';
import { formatRelativeTime } from '@/utils/sensorUtils';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (id: string) => Promise<void>;
}

type UiSeverity = 'critical' | 'warning' | 'info';

const SEVERITY_ICONS: Record<UiSeverity, React.ElementType> = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_ICON_COLORS: Record<UiSeverity, string> = {
  critical: 'text-severity-critical',
  warning: 'text-severity-warning',
  info: 'text-severity-info',
};

const BORDER_CLASSES: Record<UiSeverity, string> = {
  critical: 'alert-border-critical',
  warning: 'alert-border-warning',
  info: 'alert-border-info',
};

function getUiSeverity(severity: string): UiSeverity {
  if (severity === 'critical') return 'critical';
  if (severity === 'warning') return 'warning';
  return 'info';
}

export default function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const uiSeverity = getUiSeverity(alert.severity);
  const SeverityIcon = SEVERITY_ICONS[uiSeverity];
  const iconColor = SEVERITY_ICON_COLORS[uiSeverity];

  const isAcknowledged = alert.acknowledged || isDone;

  const handleAcknowledge = async () => {
    if (isAcknowledging || isAcknowledged) return;

    setIsAcknowledging(true);

    try {
      await onAcknowledge(alert.id);
      setIsDone(true);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setIsAcknowledging(false);
    }
  };

  return (
    <div
      className={`
        rounded-xl border border-border/60 bg-card overflow-hidden
        transition-all duration-300
        ${
          !isAcknowledged
            ? BORDER_CLASSES[uiSeverity]
            : 'alert-border-acknowledged'
        }
        ${isAcknowledged ? 'opacity-60' : ''}
        slide-up
      `}
      role="article"
      aria-label={`Alert: ${alert.title}, severity ${alert.severity}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div
            className={`
              mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${
                uiSeverity === 'critical'
                  ? 'bg-[var(--severity-critical-bg)]'
                  : uiSeverity === 'warning'
                    ? 'bg-[var(--severity-warning-bg)]'
                    : 'bg-[var(--severity-info-bg)]'
              }
            `}
            aria-hidden="true"
          >
            <SeverityIcon size={15} className={iconColor} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
                {alert.title}
              </h3>

              <SeverityBadge severity={uiSeverity} />
            </div>

            <p className="text-[11px] text-muted-foreground">
              {formatRelativeTime(alert.created_at)}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-3 pl-11 line-clamp-3">
          {alert.message}
        </p>

        <div className="flex items-center justify-between pl-11">
          <span className="text-[10px] font-mono text-muted-foreground/60">
            ID: {alert.id.slice(0, 8)}
          </span>

          {isAcknowledged ? (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-status-offline">
              <CheckCircle2 size={12} aria-hidden="true" />
              <span>Acknowledged</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAcknowledge}
              disabled={isAcknowledging}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                transition-all duration-150 active:scale-95
                disabled:opacity-60 disabled:cursor-not-allowed
                ${
                  uiSeverity === 'critical'
                    ? 'bg-[var(--severity-critical-bg)] text-severity-critical hover:bg-status-critical/20'
                    : uiSeverity === 'warning'
                      ? 'bg-[var(--severity-warning-bg)] text-severity-warning hover:bg-status-warning/20'
                      : 'bg-[var(--severity-info-bg)] text-severity-info hover:bg-severity-info/20'
                }
              `}
              aria-label={`Acknowledge alert: ${alert.title}`}
            >
              {isAcknowledging ? (
                <>
                  <Loader2
                    size={11}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  <span>Confirming…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={11} aria-hidden="true" />
                  <span>Acknowledge</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}