'use client';

import React from 'react';
import {
  Zap,
  Activity,
  Thermometer,
  Droplets,
  Gauge,
  BatteryCharging,
  Server,
  Waves,
} from 'lucide-react';

import SensorMetricCard from './SensorMetricCard';
import type { SensorReading, SensorStatus } from '@/types';
import {
  getVoltageStatus,
  getCurrentStatus,
  getTemperatureStatus,
  getWaterLevelStatus,
} from '@/utils/sensorUtils';

interface SensorGridProps {
  reading: SensorReading;
}

type SupabaseSensorReading = SensorReading & {
  distance_cm?: number;
  flow_rate_lmin?: number;
  total_liters?: number;
  energy_kwh?: number;
  state?: 'NORMAL' | 'WARNING' | 'WATER' | string;
  water_level?: number;
  flow_rate?: number;
  totalLiters?: number;
  energy?: number;
};

function toNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
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

function getSystemStatus(state: string): SensorStatus {
  if (state === 'WARNING') return 'warning';
  return 'normal';
}

export default function SensorGrid({ reading }: SensorGridProps) {
  const data = reading as SupabaseSensorReading;

  const voltage = toNumber(data.voltage);
  const current = toNumber(data.current);
  const temperature = toNumber(data.temperature);
  const distanceCm = toNumber(data.distance_cm);

  const waterLevel =
    typeof data.water_level === 'number'
      ? data.water_level
      : computeWaterLevel(distanceCm);

  const flowRate = toNumber(data.flow_rate_lmin ?? data.flow_rate);
  const totalLiters = toNumber(data.total_liters ?? data.totalLiters);
  const energyKwh = toNumber(data.energy_kwh ?? data.energy);
  const systemState = data.state ?? 'NORMAL';

  const systemStatus = getSystemStatus(systemState);

  const cards = [
    {
      id: 'card-voltage',
      label: 'Supply Voltage',
      value: voltage.toFixed(1),
      unit: 'V',
      status: getVoltageStatus(voltage),
      icon: <Zap size={16} />,
      sublabel: 'Nominal: 220–240V',
    },
    {
      id: 'card-current',
      label: 'Motor Current',
      value: current.toFixed(2),
      unit: 'A',
      status: getCurrentStatus(current),
      icon: <Activity size={16} />,
      sublabel: 'Max: 10A',
    },
    {
      id: 'card-temperature',
      label: 'Reactor Temp',
      value: temperature.toFixed(1),
      unit: '°C',
      status: getTemperatureStatus(temperature),
      icon: <Thermometer size={16} />,
      sublabel: 'Safe: 25–42°C',
    },
    {
      id: 'card-water-level',
      label: 'Water Level',
      value: waterLevel.toFixed(1),
      unit: '%',
      status: getWaterLevelStatus(waterLevel),
      icon: <Droplets size={16} />,
      sublabel: `Distance: ${distanceCm.toFixed(0)} cm`,
    },
    {
      id: 'card-flow-rate',
      label: 'Flow Rate',
      value: flowRate.toFixed(2),
      unit: 'L/min',
      status: 'normal' as SensorStatus,
      icon: <Waves size={16} />,
      sublabel: 'Water flow sensor',
    },
    {
      id: 'card-total-liters',
      label: 'Total Liters',
      value: totalLiters.toFixed(2),
      unit: 'L',
      status: 'normal' as SensorStatus,
      icon: <Gauge size={16} />,
      sublabel: 'Accumulated water usage',
    },
    {
      id: 'card-energy',
      label: 'Energy Used',
      value: energyKwh.toFixed(4),
      unit: 'kWh',
      status: 'normal' as SensorStatus,
      icon: <BatteryCharging size={16} />,
      sublabel: 'Total energy consumption',
    },
    {
      id: 'card-system',
      label: 'System State',
      value: systemState,
      unit: '',
      status: systemStatus,
      icon: <Server size={16} />,
      sublabel: 'SBR Controller',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {cards.map((card) => (
        <SensorMetricCard
          key={card.id}
          id={card.id}
          label={card.label}
          value={card.value}
          unit={card.unit}
          status={card.status}
          icon={card.icon}
          sublabel={card.sublabel}
        />
      ))}
    </div>
  );
}