'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { SensorReading } from '@/types';
import { supabase } from '@/lib/supabaseClient';

import DashboardHeader from './DashboardHeader';
import DeviceStatusBanner from './DeviceStatusBanner';
import LiveIndicator from './LiveIndicator';
import QuickStatsBar from './QuickStatsBar';
import SensorGrid from './SensorGrid';
import { SensorCardSkeleton } from '@/components/ui/LoadingSkeleton';

type DeviceStatus = 'connected' | 'disconnected' | 'unstable';

type DatabaseSensorReading = {
  id: string;
  device_id: string;
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  distance_cm: number | null;
  flow_rate_lmin: number | null;
  total_liters: number | null;
  energy_kwh: number | null;
  state: 'NORMAL' | 'WARNING' | 'WATER' | null;
  raw_payload: string | null;
  created_at: string;
};

const DEVICE_TIMEOUT_UNSTABLE = 15000;
const DEVICE_TIMEOUT_DISCONNECTED = 30000;

function getDeviceStatus(lastUpdated?: string): DeviceStatus {
  if (!lastUpdated) return 'disconnected';

  const lastTime = new Date(lastUpdated).getTime();
  const diff = Date.now() - lastTime;

  if (diff > DEVICE_TIMEOUT_DISCONNECTED) return 'disconnected';
  if (diff > DEVICE_TIMEOUT_UNSTABLE) return 'unstable';

  return 'connected';
}

function normalizeReading(row: DatabaseSensorReading): SensorReading {
  const distance = row.distance_cm ?? 0;

  // ultrasonic conversion:
  // smaller distance = mas puno ang tank
  // larger distance = mas mababa ang tubig
  const TANK_EMPTY_DISTANCE_CM = 25;
  const TANK_FULL_DISTANCE_CM = 5;

  let waterLevel =
    ((TANK_EMPTY_DISTANCE_CM - distance) /
      (TANK_EMPTY_DISTANCE_CM - TANK_FULL_DISTANCE_CM)) *
    100;

  waterLevel = Math.max(0, Math.min(100, waterLevel));

  const normalized = {
    id: row.id,
    device_id: row.device_id,

    voltage: row.voltage ?? 0,
    current: row.current ?? 0,
    temperature: row.temperature ?? 0,

    distance_cm: distance,
    flow_rate_lmin: row.flow_rate_lmin ?? 0,
    total_liters: row.total_liters ?? 0,
    energy_kwh: row.energy_kwh ?? 0,

    // these are needed by your existing SensorGrid
    water_level: waterLevel,
    flow_rate: row.flow_rate_lmin ?? 0,
    total_liters_used: row.total_liters ?? 0,
    energy_consumption: row.energy_kwh ?? 0,

    state: row.state ?? 'NORMAL',
    raw_payload: row.raw_payload ?? '',
    created_at: row.created_at,

    // extra aliases, para safe sa ibang components
    distance: distance,
    totalLiters: row.total_liters ?? 0,
    energy: row.energy_kwh ?? 0,
  };

  return normalized as unknown as SensorReading;
}

export default function DashboardClient() {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [readingCount, setReadingCount] = useState(0);
  const [deviceStatus, setDeviceStatus] =
    useState<DeviceStatus>('disconnected');

  const unacknowledgedAlerts =
    reading && (reading as any).state === 'WARNING' ? 1 : 0;

  const updateReading = useCallback((row: DatabaseSensorReading) => {
    const normalized = normalizeReading(row);

    setReading(normalized);
    setReadingCount((count) => count + 1);
    setDeviceStatus(getDeviceStatus(row.created_at));
  }, []);

  const fetchLatestReading = useCallback(async () => {
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest sensor reading:', error.message);
      setDeviceStatus('disconnected');
      return;
    }

    if (data) {
      updateReading(data as DatabaseSensorReading);
    }
  }, [updateReading]);

  useEffect(() => {
    let mounted = true;

    async function loadInitialReading() {
      setIsLoading(true);

      await fetchLatestReading();

      if (mounted) {
        setIsLoading(false);
      }
    }

    loadInitialReading();

    return () => {
      mounted = false;
    };
  }, [fetchLatestReading]);

  useEffect(() => {
    const channel = supabase
      .channel('sensor-readings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
        },
        (payload) => {
          updateReading(payload.new as DatabaseSensorReading);
        }
      )
      .subscribe((status) => {
        console.log('Supabase realtime status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateReading]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDeviceStatus(getDeviceStatus(reading?.created_at));
    }, 5000);

    return () => clearInterval(interval);
  }, [reading?.created_at]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchLatestReading();
    setIsRefreshing(false);
  }, [fetchLatestReading]);

  return (
    <div className="fade-in">
      <DashboardHeader alertCount={unacknowledgedAlerts} />

      <DeviceStatusBanner
        status={deviceStatus}
        lastUpdated={reading?.created_at ?? ''}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {!isLoading && reading && (
        <>
          <QuickStatsBar reading={reading} />

          <div className="px-4 mt-4 mb-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Sensor Readings
              </h2>

              <LiveIndicator
                lastReadingTime={reading.created_at}
                readingCount={readingCount}
              />
            </div>
          </div>

          <SensorGrid reading={reading} />
        </>
      )}

      {!isLoading && !reading && (
        <div className="px-4 mt-6">
          <div className="rounded-xl border border-border bg-card px-4 py-5 text-center">
            <p className="text-sm font-medium text-foreground">
              No sensor reading yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Waiting for ESP32 to send data to Supabase.
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <>
          <div className="mx-4 mt-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="animate-pulse h-4 w-40 bg-secondary rounded mb-3" />
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={`stat-skel-${i}`}
                  className="flex-1 h-16 rounded-lg bg-secondary animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="px-4 mt-4 mb-1">
            <div className="animate-pulse h-4 w-32 bg-secondary rounded" />
          </div>

          <div className="grid grid-cols-2 gap-3 px-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SensorCardSkeleton key={`skel-${i + 1}`} />
            ))}
          </div>
        </>
      )}

      <div className="h-6" />
    </div>
  );
}