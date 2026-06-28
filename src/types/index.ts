export type UserRole = 'admin' | 'operator';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  contact_number: string;
  must_reset_password?: boolean;
  created_at: string;
}

export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';
export type PumpRelayStatus = 'ON' | 'OFF';
export type SystemStatus = 'Online' | 'Offline' | 'Warning';
export type TurbidityLevel = 'Clear' | 'Moderate' | 'High';
export type DeviceConnectionStatus = 'connected' | 'disconnected' | 'unstable';

export interface SensorReading {
  id: string;
  voltage: number;
  current: number;
  temperature: number;
  water_level: number;
  turbidity: TurbidityLevel;
  pump_status: PumpRelayStatus;
  relay_status: PumpRelayStatus;
  system_status: SystemStatus;
  created_at: string;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  acknowledged: boolean;
  created_at: string;
}

export interface SensorMetricCard {
  id: string;
  label: string;
  value: string | number;
  unit: string;
  status: SensorStatus;
  icon: string;
  trend?: number;
}

export interface ChartDataPoint {
  time: string;
  voltage: number;
  current: number;
  temperature: number;
  water_level: number;
}