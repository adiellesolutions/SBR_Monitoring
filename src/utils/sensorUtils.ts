import type { SensorStatus, TurbidityLevel } from '@/types';

export function getVoltageStatus(v: number): SensorStatus {
  if (v < 210 || v > 245) return 'critical';
  if (v < 218 || v > 240) return 'warning';
  return 'normal';
}

export function getCurrentStatus(a: number): SensorStatus {
  if (a > 9.5 || a < 0.5) return 'critical';
  if (a > 8.0 || a < 1.0) return 'warning';
  return 'normal';
}

export function getTemperatureStatus(t: number): SensorStatus {
  if (t > 43 || t < 20) return 'critical';
  if (t > 40 || t < 22) return 'warning';
  return 'normal';
}

export function getWaterLevelStatus(w: number): SensorStatus {
  if (w > 95 || w < 5) return 'critical';
  if (w > 85 || w < 15) return 'warning';
  return 'normal';
}

export function getTurbidityStatus(t: TurbidityLevel): SensorStatus {
  if (t === 'High') return 'critical';
  if (t === 'Moderate') return 'warning';
  return 'normal';
}

export function statusColor(status: SensorStatus): string {
  switch (status) {
    case 'normal': return 'text-status-normal';
    case 'warning': return 'text-status-warning';
    case 'critical': return 'text-status-critical';
    default: return 'text-status-offline';
  }
}

export function statusBg(status: SensorStatus): string {
  switch (status) {
    case 'normal': return 'bg-[var(--status-normal-bg)]';
    case 'warning': return 'bg-[var(--status-warning-bg)]';
    case 'critical': return 'bg-[var(--status-critical-bg)]';
    default: return 'bg-[var(--status-offline-bg)]';
  }
}

export function statusGlow(status: SensorStatus): string {
  switch (status) {
    case 'normal': return 'card-glow-normal';
    case 'warning': return 'card-glow-warning';
    case 'critical': return 'card-glow-critical';
    default: return 'card-glow-offline';
  }
}

export function statusDot(status: SensorStatus): string {
  switch (status) {
    case 'normal': return 'bg-status-normal';
    case 'warning': return 'bg-status-warning';
    case 'critical': return 'bg-status-critical';
    default: return 'bg-status-offline';
  }
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function generateMockReading(): import('@/types').SensorReading {
  const turbidityOptions: TurbidityLevel[] = ['Clear', 'Moderate', 'High'];
  const turbidityWeights = [0.6, 0.3, 0.1];
  const rand = Math.random();
  let turbidity: TurbidityLevel = 'Clear';
  if (rand > turbidityWeights[0] + turbidityWeights[1]) turbidity = 'High';
  else if (rand > turbidityWeights[0]) turbidity = 'Moderate';

  const voltage = parseFloat((220 + Math.random() * 20).toFixed(1));
  const current = parseFloat((1 + Math.random() * 9).toFixed(2));
  const temperature = parseFloat((25 + Math.random() * 20).toFixed(1));
  const water_level = parseFloat((20 + Math.random() * 70).toFixed(1));
  const pump_status = Math.random() > 0.15 ? 'ON' : 'OFF';
  const relay_status = Math.random() > 0.1 ? 'ON' : 'OFF';

  const voltStatus = getVoltageStatus(voltage);
  const tempStatus = getTemperatureStatus(temperature);
  const turbStatus = getTurbidityStatus(turbidity);
  const pumpOff = pump_status === 'OFF';

  let system_status: import('@/types').SystemStatus = 'Online';
  if (voltStatus === 'critical' || tempStatus === 'critical' || turbStatus === 'critical' || pumpOff) {
    system_status = 'Warning';
  }

  return {
    id: `reading-${Date.now()}`,
    voltage,
    current,
    temperature,
    water_level,
    turbidity,
    pump_status: pump_status as import('@/types').PumpRelayStatus,
    relay_status: relay_status as import('@/types').PumpRelayStatus,
    system_status,
    created_at: new Date().toISOString(),
  };
}

export function generateChartHistory(points = 20): import('@/types').ChartDataPoint[] {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - 1 - i) * 5 * 60 * 1000);
    const h = t.getHours().toString().padStart(2, '0');
    const m = t.getMinutes().toString().padStart(2, '0');
    return {
      time: `${h}:${m}`,
      voltage: parseFloat((220 + Math.sin(i * 0.4) * 8 + Math.random() * 4).toFixed(1)),
      current: parseFloat((3 + Math.sin(i * 0.3 + 1) * 2.5 + Math.random() * 1.5).toFixed(2)),
      temperature: parseFloat((30 + Math.sin(i * 0.25) * 6 + Math.random() * 3).toFixed(1)),
      water_level: parseFloat((45 + Math.sin(i * 0.5 + 0.5) * 25 + Math.random() * 5).toFixed(1)),
    };
  });
}