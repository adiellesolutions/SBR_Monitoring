import type { Alert, UserProfile } from '@/types';

export const MOCK_USERS: UserProfile[] = [
  {
    id: 'profile-001',
    email: 'admin@sbr-monitor.ph',
    full_name: 'Engr. Reyes Santos',
    role: 'admin',
    contact_number: '+63 917 123 4567',
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'profile-002',
    email: 'operator@sbr-monitor.ph',
    full_name: 'Juan dela Cruz',
    role: 'operator',
    contact_number: '+63 918 765 4321',
    created_at: '2025-02-15T09:30:00Z',
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-001',
    title: 'High Temperature Detected',
    message: 'Reactor temperature reached 43.2°C — exceeds safe operating threshold of 42°C. Biological treatment efficiency may be compromised.',
    severity: 'critical',
    acknowledged: false,
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-002',
    title: 'Turbidity Level Elevated',
    message: 'Effluent turbidity reading is Moderate. Effluent quality may not meet discharge standards. Monitor closely.',
    severity: 'warning',
    acknowledged: false,
    created_at: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-003',
    title: 'Pump 2 Offline',
    message: 'Secondary aeration pump is not responding. Manual inspection required. Reactor aeration capacity reduced by 50%.',
    severity: 'critical',
    acknowledged: false,
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-004',
    title: 'Voltage Fluctuation',
    message: 'Supply voltage dropped to 214.3V — below nominal 220V. Check main power supply and distribution panel.',
    severity: 'warning',
    acknowledged: false,
    created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-005',
    title: 'Water Level Critical Low',
    message: 'Reactor water level at 8.2% — approaching dry-run threshold. Influent valve may be blocked or closed.',
    severity: 'critical',
    acknowledged: false,
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-006',
    title: 'Device Reconnected',
    message: 'SBR controller re-established connection after 3-minute outage. All sensor readings resuming normally.',
    severity: 'info',
    acknowledged: true,
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-007',
    title: 'Current Draw Spike',
    message: 'Motor current spiked to 9.1A — near overload threshold. Check for mechanical obstruction in pump assembly.',
    severity: 'warning',
    acknowledged: true,
    created_at: new Date(Date.now() - 2.2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-008',
    title: 'Scheduled Maintenance Reminder',
    message: 'Monthly filter cleaning is due in 2 days. Schedule downtime window with plant supervisor.',
    severity: 'info',
    acknowledged: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-009',
    title: 'Relay Contact Fault',
    message: 'Control relay showed intermittent switching behavior over 15-minute window. Relay contact wear suspected.',
    severity: 'warning',
    acknowledged: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'alert-010',
    title: 'System Startup Complete',
    message: 'SBR monitoring system initialized successfully. All sensors reporting within normal range.',
    severity: 'info',
    acknowledged: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const DEMO_CREDENTIALS = [
  {
    role: 'Admin',
    email: 'admin@sbr-monitor.ph',
    password: 'SBR_Admin#2026',
    profile: MOCK_USERS[0],
  },
  {
    role: 'Operator',
    email: 'operator@sbr-monitor.ph',
    password: 'SBR_Ops#2026',
    profile: MOCK_USERS[1],
  },
];