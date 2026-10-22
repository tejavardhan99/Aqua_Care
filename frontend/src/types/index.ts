export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ActionStatus = 'Suggested only' | 'Sent to device' | 'Would trigger' | 'Failed';
export type ConnectionStatusType = 'CONNECTED' | 'STALE' | 'DISCONNECTED' | 'UNKNOWN';
export type AlertSeverityType = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';

export interface DeviceSensorStatus {
  temperature: string;
  ph: string;
  dissolved_oxygen: string;
  turbidity: string;
  ammonia: string;
  water_level: string;
}

export interface DeviceFlags {
  aerator_relay: boolean;
  pump_relay: boolean;
  wifi_rssi: number;
  battery_voltage: number;
  uptime_seconds: number;
  firmware_version: string;
  last_boot_reason: string;
  sensor_status: DeviceSensorStatus;
}

export interface TelemetryReading {
  id?: string;
  device_id: string;
  temperature: number;
  ph: number;
  dissolved_oxygen: number;
  turbidity: number;
  ammonia: number;
  water_level: number;
  timestamp?: string;
  received_at?: string;
  is_stale?: boolean;
  device_flags?: DeviceFlags;
}

export interface RuleCause {
  rule_id: string;
  rule_name: string;
  parameter: string;
  measured_value: number;
  threshold_limit: string;
  unit: string;
  severity: RiskLevel;
  description: string;
}

export interface RecommendedAction {
  action_id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  trigger_cause: string;
  device_command?: string | null;
  status: ActionStatus;
}

export interface RuleEvaluationResult {
  overall_risk: RiskLevel;
  causes: RuleCause[];
  recommended_actions: RecommendedAction[];
  timestamp: string;
  is_simulation: boolean;
  summary_message: string;
}

export interface AlertItem {
  id: string;
  severity: AlertSeverityType;
  parameter: string;
  observed_value: number;
  unit: string;
  rule_name: string;
  rule_id: string;
  explanation: string;
  recommended_action: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  pond_id: string;
  user_id: string;
  is_simulation: boolean;
}

export interface ConnectionInfo {
  status: ConnectionStatusType;
  last_seen: string | null;
  seconds_since_last_seen: number | null;
  interval_seconds: number;
}

export interface RangeThreshold {
  min_safe: number;
  max_safe: number;
  min_warning: number;
  max_warning: number;
  min_critical: number;
  max_critical: number;
  unit: string;
  description: string;
}

export interface MinThreshold {
  safe: number;
  warning: number;
  high: number;
  critical: number;
  unit: string;
  description: string;
}

export interface MaxThreshold {
  safe: number;
  warning: number;
  high: number;
  critical: number;
  unit: string;
  description: string;
}

export interface ThresholdsConfig {
  temperature: RangeThreshold;
  ph: RangeThreshold;
  dissolved_oxygen: MinThreshold;
  turbidity: RangeThreshold;
  ammonia: MaxThreshold;
  water_level: RangeThreshold;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator';
  pond_ids: string[];
}

