'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import type { ChartDataPoint } from '@/types';
import TimeFilterTabs from './TimeFilterTabs';
import SensorChart from './SensorChart';

export type TimeFilter = 'today' | '24h' | '7d' | '30d';

type DatabaseSensorReading = {
  id: string;
  voltage: number | null;
  current: number | null;
  temperature: number | null;
  distance_cm: number | null;
  created_at: string;
};

const MAX_POINTS: Record<TimeFilter, number> = {
  today: 100,
  '24h': 120,
  '7d': 160,
  '30d': 200,
};

function getStartDate(filter: TimeFilter) {
  const now = new Date();

  if (filter === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (filter === '24h') {
    return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  if (filter === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function formatTimeLabel(createdAt: string, filter: TimeFilter) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  if (filter === '7d' || filter === '30d') {
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeWaterLevel(distanceCm: number) {
  const TANK_EMPTY_DISTANCE_CM = 25;
  const TANK_FULL_DISTANCE_CM = 5;

  const waterLevel =
    ((TANK_EMPTY_DISTANCE_CM - distanceCm) /
      (TANK_EMPTY_DISTANCE_CM - TANK_FULL_DISTANCE_CM)) *
    100;

  return Math.max(0, Math.min(100, waterLevel));
}

function downsampleData<T>(rows: T[], maxPoints: number) {
  if (rows.length <= maxPoints) return rows;

  const step = Math.ceil(rows.length / maxPoints);

  return rows.filter((_, index) => index % step === 0).slice(-maxPoints);
}

function mapRowsToChartData(
  rows: DatabaseSensorReading[],
  filter: TimeFilter
): ChartDataPoint[] {
  return rows.map((row) => {
    const distance = row.distance_cm ?? 0;

    return {
      time: formatTimeLabel(row.created_at, filter),
      voltage: Number((row.voltage ?? 0).toFixed(1)),
      current: Number((row.current ?? 0).toFixed(2)),
      temperature: Number((row.temperature ?? 0).toFixed(1)),
      water_level: Number(computeWaterLevel(distance).toFixed(1)),
    };
  });
}

export default function MonitoringClient() {
  const [activeFilter, setActiveFilter] = useState<TimeFilter>('24h');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (filter: TimeFilter) => {
    setIsLoading(true);

    const startDate = getStartDate(filter);

    const { data, error } = await supabase
      .from('sensor_readings')
      .select('id, voltage, current, temperature, distance_cm, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(2000);

    if (error) {
      console.error('Error loading monitoring data:', error.message);
      setChartData([]);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as DatabaseSensorReading[];
    const sampledRows = downsampleData(rows, MAX_POINTS[filter]);

    setChartData(mapRowsToChartData(sampledRows, filter));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData(activeFilter);
  }, [activeFilter, loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('monitoring-sensor-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
        },
        (payload) => {
          const newRow = payload.new as DatabaseSensorReading;
          const startDate = getStartDate(activeFilter);

          if (new Date(newRow.created_at) < startDate) {
            return;
          }

          setChartData((currentData) => {
            const newPoint = mapRowsToChartData([newRow], activeFilter)[0];
            const updatedData = [...currentData, newPoint];

            return downsampleData(updatedData, MAX_POINTS[activeFilter]);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeFilter]);

  const handleFilterChange = (filter: TimeFilter) => {
    setActiveFilter(filter);
  };

  return (
    <div className="fade-in">
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'rgba(34,211,238,0.12)' }}
          >
            <Activity size={15} className="text-primary" />
          </div>

          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Sensor Trends
          </h1>
        </div>

        <p className="text-xs text-muted-foreground ml-9">
          Historical data analysis for SBR system
        </p>
      </div>

      <div className="px-4 mb-4">
        <TimeFilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="px-4 space-y-4 pb-6">
        <SensorChart
          data={chartData}
          isLoading={isLoading}
          dataKey="voltage"
          label="Voltage"
          unit="V"
          color="#22d3ee"
          domain={[200, 250]}
          normalMin={218}
          normalMax={240}
        />

        <SensorChart
          data={chartData}
          isLoading={isLoading}
          dataKey="current"
          label="Current"
          unit="A"
          color="#f59e0b"
          domain={[0, 12]}
          normalMin={1}
          normalMax={8}
        />

        <SensorChart
          data={chartData}
          isLoading={isLoading}
          dataKey="temperature"
          label="Temperature"
          unit="°C"
          color="#ef4444"
          domain={[15, 55]}
          normalMin={22}
          normalMax={40}
        />

        <SensorChart
          data={chartData}
          isLoading={isLoading}
          dataKey="water_level"
          label="Water Level"
          unit="%"
          color="#22c55e"
          domain={[0, 100]}
          normalMin={15}
          normalMax={85}
        />
      </div>
    </div>
  );
}