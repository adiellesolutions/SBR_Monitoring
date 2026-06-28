'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCheck, Bell } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import type { Alert } from '@/types';
import type { AlertFilter } from './AlertFilterTabs';

import AlertFilterTabs from './AlertFilterTabs';
import AlertCard from './AlertCard';
import AlertsEmptyState from './AlertsEmptyState';
import { AlertCardSkeleton } from '@/components/ui/LoadingSkeleton';

type DatabaseAlert = {
  id: string;
  device_id: string | null;
  title: string;
  message: string;
  severity: 'normal' | 'warning' | 'critical';
  type: string | null;
  acknowledged: boolean;
  created_at: string;
};

function normalizeAlert(row: DatabaseAlert): Alert {
  const normalized = {
    id: row.id,
    device_id: row.device_id ?? 'prototype-001',

    title: row.title,
    message: row.message,
    severity: row.severity,
    type: row.type ?? 'system',

    acknowledged: row.acknowledged,
    created_at: row.created_at,

    // aliases para safe kung ibang name ang gamit ng AlertCard mo
    timestamp: row.created_at,
    time: row.created_at,
    date: row.created_at,
  };

  return normalized as unknown as Alert;
}

interface AlertsClientProps {
  initialAlerts?: Alert[];
}

export default function AlertsClient({ initialAlerts = [] }: AlertsClientProps) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkAcknowledging, setIsBulkAcknowledging] = useState(false);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading alerts:', error.message);
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    const normalizedAlerts = ((data ?? []) as DatabaseAlert[]).map(
      normalizeAlert
    );

    setAlerts(normalizedAlerts);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const newAlert = normalizeAlert(payload.new as DatabaseAlert);

          setAlerts((prev) => {
            const exists = prev.some((alert) => alert.id === newAlert.id);
            if (exists) return prev;

            return [newAlert, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          const updatedAlert = normalizeAlert(payload.new as DatabaseAlert);

          setAlerts((prev) =>
            prev.map((alert) =>
              alert.id === updatedAlert.id ? updatedAlert : alert
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Alerts realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const counts: Record<AlertFilter, number> = {
    all: alerts.length,
    active: alerts.filter((a) => !a.acknowledged).length,
    critical: alerts.filter(
      (a) => a.severity === 'critical' && !a.acknowledged
    ).length,
    acknowledged: alerts.filter((a) => a.acknowledged).length,
  };

  const warningCount = alerts.filter(
    (a) => a.severity === 'warning' && !a.acknowledged
  ).length;

  const filteredAlerts = alerts.filter((alert) => {
    switch (activeFilter) {
      case 'active':
        return !alert.acknowledged;

      case 'critical':
        return alert.severity === 'critical' && !alert.acknowledged;

      case 'acknowledged':
        return alert.acknowledged;

      default:
        return true;
    }
  });

  const handleAcknowledge = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .eq('id', id);

    if (error) {
      console.error('Error acknowledging alert:', error.message);
      return;
    }

    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const handleAcknowledgeAll = useCallback(async () => {
    const activeIds = alerts
      .filter((alert) => !alert.acknowledged)
      .map((alert) => alert.id);

    if (activeIds.length === 0) return;

    setIsBulkAcknowledging(true);

    const { error } = await supabase
      .from('alerts')
      .update({ acknowledged: true })
      .in('id', activeIds);

    if (error) {
      console.error('Error acknowledging all alerts:', error.message);
      setIsBulkAcknowledging(false);
      return;
    }

    setAlerts((prev) =>
      prev.map((alert) => ({ ...alert, acknowledged: true }))
    );

    setIsBulkAcknowledging(false);
  }, [alerts]);

  const activeCount = counts.active;

  return (
    <div className="fade-in">
      <div className="px-4 pt-5 pb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Bell size={16} className="text-primary" aria-hidden="true" />

            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Alerts
            </h1>

            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-status-critical text-white text-[11px] font-bold">
                {activeCount}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            SBR plant notifications and fault events
          </p>
        </div>

        {activeCount > 1 && (
          <button
            type="button"
            onClick={handleAcknowledgeAll}
            disabled={isBulkAcknowledging}
            className="
              flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
              bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80
              transition-all duration-150 active:scale-95 disabled:opacity-50
              border border-border
            "
            aria-label={`Acknowledge all ${activeCount} active alerts`}
          >
            {isBulkAcknowledging ? (
              <>
                <span
                  className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"
                  aria-hidden="true"
                />
                <span>Clearing…</span>
              </>
            ) : (
              <>
                <CheckCheck size={13} aria-hidden="true" />
                <span>Ack All ({activeCount})</span>
              </>
            )}
          </button>
        )}
      </div>

      {counts.all > 0 && (
        <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[var(--status-critical-bg)] border border-status-critical/15 p-3 text-center">
            <p className="text-lg font-bold text-status-critical font-mono">
              {counts.critical}
            </p>
            <p className="text-[10px] text-status-critical/70 font-medium">
              Critical
            </p>
          </div>

          <div className="rounded-xl bg-[var(--status-warning-bg)] border border-status-warning/15 p-3 text-center">
            <p className="text-lg font-bold text-status-warning font-mono">
              {warningCount}
            </p>
            <p className="text-[10px] text-status-warning/70 font-medium">
              Warning
            </p>
          </div>

          <div className="rounded-xl bg-secondary border border-border p-3 text-center">
            <p className="text-lg font-bold text-muted-foreground font-mono">
              {counts.acknowledged}
            </p>
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              Resolved
            </p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <AlertFilterTabs
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
      </div>

      <div className="px-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <AlertCardSkeleton key={`alert-skel-${i + 1}`} />
          ))
        ) : filteredAlerts.length === 0 ? (
          <AlertsEmptyState filter={activeFilter} />
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onAcknowledge={handleAcknowledge}
            />
          ))
        )}
      </div>

      <div className="h-8" />
    </div>
  );
}