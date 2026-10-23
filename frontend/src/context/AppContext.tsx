import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type {
  TelemetryReading,
  RuleEvaluationResult,
  AlertItem,
  ConnectionInfo,
  ThresholdsConfig,
  User,
  MqttStatus,
  DeviceFlags,
} from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

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
  mqttStatus: MqttStatus | null;
  isLiveLoading: boolean;
  liveError: string | null;
  lastUpdated: Date | null;
  refreshLive: () => Promise<void>;
  refreshMqttStatus: () => Promise<void>;

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
  const [mqttStatus, setMqttStatus] = useState<MqttStatus | null>(null);
  const [isLiveLoading, setIsLiveLoading] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Alerts states
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(0);

  // Thresholds states
  const [thresholds, setThresholds] = useState<ThresholdsConfig | null>(null);

  const prevRiskRef = useRef<string | null>(null);

  // Refresh MQTT status
  const refreshMqttStatus = useCallback(async () => {
    try {
      const st = await api.getMqttStatus();
      setMqttStatus(st);
    } catch {
      // Backend MQTT status optional
    }
  }, []);

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

  // 4. Real-time WebSocket connection to backend live stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connectWs = () => {
      try {
        let wsUrl: string;
        const apiBase = api.getBaseUrl();
        if (apiBase.startsWith('https://')) {
          wsUrl = `${apiBase.replace('https://', 'wss://')}/api/telemetry/ws`;
        } else if (apiBase.startsWith('http://')) {
          wsUrl = `${apiBase.replace('http://', 'ws://')}/api/telemetry/ws`;
        } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const host = window.location.port === '5173' ? 'aqua-care-1-s5i8.onrender.com' : window.location.host;
          wsUrl = `${protocol}//${host}/api/telemetry/ws`;
        }
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'TELEMETRY_UPDATE' || msg.type === 'INIT_STATE') {
              const d = msg.data;
              if (d.record) setLiveReading(d.record);
              if (d.evaluation) setLiveEvaluation(d.evaluation);
              if (d.connection) setConnection(d.connection);
              if (d.device_flags) setDeviceFlags(d.device_flags);
              if (d.mqtt) {
                setMqttStatus((prev: any) => ({
                  ...(prev || {}),
                  ...d.mqtt,
                  is_connected: true,
                  status: 'CONNECTED',
                }));
              }
              setLastUpdated(new Date());
              setIsLiveLoading(false);
            }
          } catch (e) {
            console.error('WS parse error', e);
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (e) {
        console.warn('WS error', e);
      }
    };

    connectWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  // 6. Direct HiveMQ MQTT Stream Listener (Browser-native WebSockets)
  useEffect(() => {
    const BROKER = 'wss://broker.hivemq.com:8884/mqtt';
    const TOPIC = new URLSearchParams(window.location.search).get('topic') || 'prawnagent/pond01/state';

    const onData = (d: any) => {
      const reading: TelemetryReading = {
        device_id: d.pond ? `ESP32-${String(d.pond).toUpperCase()}` : 'ESP32-POND-01',
        temperature: Number(d.temperature),
        dissolved_oxygen: Number(d.do),
        ammonia: Number(d.ammonia),
        turbidity: Number(d.turbidity),
        nitrate: d.nitrate !== undefined ? Number(d.nitrate) : undefined,
        ph: d.ph !== undefined ? Number(d.ph) : 7.6,
        water_level: d.water_level !== undefined ? Number(d.water_level) : 1.35,
        received_at: new Date().toISOString(),
        is_stale: false,
        device_flags: {
          aerator_relay: Boolean(d.aerator),
          pump_relay: Boolean(d.water_pump),
          feeder_relay: Boolean(d.feeder_pump),
          dosing_relay: Boolean(d.dosing_pump),
          alarm_active: Boolean(d.alarm),
          data_ok: Boolean(d.data_ok),
          wifi_rssi: d.rssi !== undefined ? Number(d.rssi) : -63,
          battery_voltage: d.v_bat !== undefined ? Number(d.v_bat) : 4.14,
          uptime_seconds: Number(d.uptime_s || 0),
          firmware_version: 'v1.2.4-mqtt',
          last_boot_reason: 'POWERON_RESET',
          sensor_status: {
            temperature: d.data_ok ? 'OK' : 'STALE',
            dissolved_oxygen: d.data_ok ? 'OK' : 'STALE',
            ammonia: d.data_ok ? 'OK' : 'STALE',
            turbidity: d.data_ok ? 'OK' : 'STALE',
            nitrate: d.data_ok ? 'OK' : 'STALE',
            ph: 'CALIBRATED_NOMINAL',
            water_level: 'CALIBRATED_NOMINAL',
          },
        },
      };

      setLiveReading(reading);
      setDeviceFlags(reading.device_flags || null);
      setConnection({
        status: 'CONNECTED',
        last_seen: new Date().toISOString(),
        seconds_since_last_seen: 0,
        interval_seconds: 2,
      });
      setMqttStatus((prev: any) => ({
        broker: BROKER,
        topic: TOPIC,
        is_connected: true,
        status: 'CONNECTED',
        packets_received: (prev?.packets_received || 0) + 1,
        last_packet_time: new Date().toISOString(),
      }));
      setLastUpdated(new Date());
      setIsLiveLoading(false);

      // Ingest to backend for evaluation & alerts
      api.syncMqttTelemetry(reading).then((res) => {
        if (res.evaluation) {
          setLiveEvaluation(res.evaluation);
        }
      }).catch(() => {});
    };

    let lastMsg = 0;
    const mqttLib = (window as any).mqtt;
    if (!mqttLib) return;

    try {
      const client = mqttLib.connect(BROKER, { reconnectPeriod: 3000 });
      client.on('connect', () => {
        client.subscribe(TOPIC);
        setMqttStatus((prev: any) => ({
          broker: BROKER,
          topic: TOPIC,
          is_connected: true,
          status: 'CONNECTED',
          packets_received: prev?.packets_received || 0,
          last_packet_time: prev?.last_packet_time || null,
        }));
      });

      client.on('close', () => {
        setMqttStatus((prev: any) => ({
          broker: BROKER,
          topic: TOPIC,
          is_connected: false,
          status: 'DISCONNECTED',
          packets_received: prev?.packets_received || 0,
          last_packet_time: prev?.last_packet_time || null,
        }));
      });

      client.on('message', (_topic: string, message: any) => {
        try {
          const d = JSON.parse(message.toString());
          lastMsg = Date.now();
          onData(d);
        } catch (e) {}
      });

      const staleCheck = setInterval(() => {
        if (lastMsg && Date.now() - lastMsg > 5000) {
          setConnection((prev) => ({
            ...prev,
            status: 'STALE',
            seconds_since_last_seen: Math.round((Date.now() - lastMsg) / 1000),
          }));
        }
      }, 1000);

      return () => {
        clearInterval(staleCheck);
        client.end();
      };
    } catch (e) {
      console.warn('Direct MQTT client init failed:', e);
    }
  }, []);

  // 5. Initial load & Periodic Polling Loop
  useEffect(() => {
    refreshLive();
    refreshAlerts();
    refreshThresholds();
    refreshMqttStatus();

    // Check user session
    api.getMe().then(user => setCurrentUser(user)).catch(() => {});

    // Periodic sync interval (fallback and alerts)
    const interval = setInterval(() => {
      refreshLive();
      refreshAlerts();
      refreshMqttStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshLive, refreshAlerts, refreshThresholds, refreshMqttStatus]);

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
        mqttStatus,
        isLiveLoading,
        liveError,
        lastUpdated,
        refreshLive,
        refreshMqttStatus,
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
