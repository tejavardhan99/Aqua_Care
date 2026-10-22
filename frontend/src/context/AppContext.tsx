import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  TelemetryReading,
  RuleEvaluationResult,
  AlertItem,
  ConnectionInfo,
  ThresholdsConfig,
  User,
} from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

export interface DeviceFlags {
  aerator_relay?: boolean;
  pump_relay?: boolean;
  wifi_rssi?: number;
  battery_voltage?: number;
  uptime_seconds?: number;
  firmware_version?: string;
  last_boot_reason?: string;
  sensor_status?: Record<string, string>;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;

  // Live Telemetry state (Pure ESP32 data from backend)
  liveReading: TelemetryReading | null;
  liveEvaluation: RuleEvaluationResult | null;
  connection: ConnectionInfo;
  deviceFlags: DeviceFlags | null;
  isLiveLoading: boolean;
  liveError: string | null;
  lastUpdated: Date | null;
  refreshLive: () => Promise<void>;

  // Alerts state
  alerts: AlertItem[];
  unreadAlertCount: number;
  refreshAlerts: () => Promise<void>;
  ackAlert: (id: string) => Promise<void>;
  ackAllAlerts: () => Promise<void>;

  // Thresholds state (Read-only view for farmers)
  thresholds: ThresholdsConfig | null;
  refreshThresholds: () => Promise<void>;

  // Device actions (Real hardware actuation)
  executeDeviceAction: (command: string, actionTitle: string) => Promise<void>;
}

const defaultConnection: ConnectionInfo = {
  status: 'UNKNOWN',
  last_seen: null,
  seconds_since_last_seen: null,
  interval_seconds: 10,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr-oper-01',
    email: 'operator@aquacare.io',
    full_name: 'Ramesh Kumar',
    role: 'operator',
    pond_ids: ['pond-01'],
  });

  // Live states
  const [liveReading, setLiveReading] = useState<TelemetryReading | null>(null);
  const [liveEvaluation, setLiveEvaluation] = useState<RuleEvaluationResult | null>(null);
  const [connection, setConnection] = useState<ConnectionInfo>(defaultConnection);
  const [deviceFlags, setDeviceFlags] = useState<DeviceFlags | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Alerts states
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);

  // Thresholds states
  const [thresholds, setThresholds] = useState<ThresholdsConfig | null>(null);

  const prevRiskRef = useRef<string | null>(null);

  // 1. Fetch Live Data strictly from ESP32 edge backend
  const refreshLive = useCallback(async () => {
    try {
      setLiveError(null);
      const data = await api.getLatestTelemetry();
      if (data.record) {
        setLiveReading(data.record);
      }
      if (data.evaluation) {
        setLiveEvaluation(data.evaluation);

        // Toast on severity change to CRITICAL or HIGH
        if (prevRiskRef.current && prevRiskRef.current !== data.evaluation.overall_risk) {
          if (data.evaluation.overall_risk === 'CRITICAL') {
            toast.error('CRITICAL POND HAZARD DETECTED', {
              description: data.evaluation.summary_message,
              duration: 7000,
            });
          } else if (data.evaluation.overall_risk === 'HIGH') {
            toast.warning('Pond Warning: High Risk Detected', {
              description: data.evaluation.summary_message,
              duration: 5000,
            });
          }
        }
        prevRiskRef.current = data.evaluation.overall_risk;
      }
      if (data.connection) {
        setConnection(data.connection);
      }
      if (data.device_flags) {
        setDeviceFlags(data.device_flags);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      setLiveError(err.message || 'Unable to connect to AquaCare backend');
    } finally {
      setIsLiveLoading(false);
    }
  }, []);

  // 2. Fetch Alerts scoped to farmer's pond
  const refreshAlerts = useCallback(async () => {
    try {
      const list = await api.getAlerts({ limit: 40 });
      setAlerts(list);
      const countRes = await api.getUnreadAlertCount();
      setUnreadAlertCount(countRes.unread_count);
    } catch (err) {
      console.warn('Could not fetch alerts', err);
    }
  }, []);

  // 3. Fetch Thresholds (Read-only for farmers)
  const refreshThresholds = useCallback(async () => {
    try {
      const cfg = await api.getThresholds();
      setThresholds(cfg);
    } catch (err) {
      console.warn('Could not fetch thresholds', err);
    }
  }, []);

  // 4. Initial load & Polling Loop
  useEffect(() => {
    refreshLive();
    refreshAlerts();
    refreshThresholds();

    // Check user session
    api.getMe().then(user => setCurrentUser(user)).catch(() => {});

    // Polling interval (every 4 seconds for responsive real-time telemetry)
    const interval = setInterval(() => {
      refreshLive();
      refreshAlerts();
    }, 4000);

    return () => clearInterval(interval);
  }, [refreshLive, refreshAlerts, refreshThresholds]);

  // Auth actions
  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setCurrentUser(res.user);
    toast.success(`Welcome back, ${res.user.full_name}`);
  };

  const logout = () => {
    api.setToken(null);
    setCurrentUser(null);
    toast.info('Logged out');
  };

  // Alert acknowledgements
  const ackAlert = async (id: string) => {
    try {
      await api.acknowledgeAlert(id);
      toast.success('Alert acknowledged');
      refreshAlerts();
    } catch (err: any) {
      toast.error('Failed to acknowledge alert', { description: err.message });
    }
  };

  const ackAllAlerts = async () => {
    try {
      const res = await api.acknowledgeAllAlerts();
      toast.success(`Acknowledged ${res.acknowledged_count} alerts`);
      refreshAlerts();
    } catch (err: any) {
      toast.error('Failed to acknowledge alerts', { description: err.message });
    }
  };

  // Device command dispatch
  const executeDeviceAction = async (command: string, actionTitle: string) => {
    try {
      const res = await api.sendDeviceCommand(command);
      toast.success(`Command sent to device: ${actionTitle}`, { description: res.message });
      refreshLive();
    } catch (err: any) {
      toast.error(`Device command failed: ${actionTitle}`, { description: err.message });
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        logout,
        liveReading,
        liveEvaluation,
        connection,
        deviceFlags,
        isLiveLoading,
        liveError,
        lastUpdated,
        refreshLive,
        alerts,
        unreadAlertCount,
        refreshAlerts,
        ackAlert,
        ackAllAlerts,
        thresholds,
        refreshThresholds,
        executeDeviceAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
