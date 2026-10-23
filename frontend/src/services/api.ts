import type {
  TelemetryReading,
  RuleEvaluationResult,
  AlertItem,
  ConnectionInfo,
  ThresholdsConfig,
  User,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://aqua-care-1-s5i8.onrender.com';

class ApiClient {
  getBaseUrl(): string { return API_BASE; }
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('aquacare_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('aquacare_token', token);
    } else {
      localStorage.removeItem('aquacare_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ access_token: string; token_type: string; user: User }> {
    const data = await this.request<{ access_token: string; token_type: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.access_token);
    return data;
  }

  async getMe(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // Telemetry Endpoints
  async getLatestTelemetry(): Promise<{
    record: TelemetryReading | null;
    evaluation: RuleEvaluationResult | null;
    connection: ConnectionInfo;
    device_flags: any;
  }> {
    return this.request('/api/telemetry/latest');
  }

  async getTelemetryHistory(range: '1h' | '6h' | '24h' | 'all' = '24h'): Promise<TelemetryReading[]> {
    return this.request<TelemetryReading[]>(`/api/telemetry/history?range=${range}`);
  }

  async syncMqttTelemetry(payload: any): Promise<any> {
    return this.request('/api/telemetry/mqtt-sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Thresholds Endpoints (Read-only for end-user farmers)
  async getThresholds(): Promise<ThresholdsConfig> {
    return this.request<ThresholdsConfig>('/api/rules/thresholds');
  }

  async updateThresholds(thresholds: Partial<ThresholdsConfig>): Promise<ThresholdsConfig> {
    return this.request<ThresholdsConfig>('/api/rules/thresholds', {
      method: 'PUT',
      body: JSON.stringify(thresholds),
    });
  }

  // Alerts Endpoints
  async getAlerts(params: {
    severity?: string;
    unacknowledged_only?: boolean;
    limit?: number;
  } = {}): Promise<AlertItem[]> {
    const query = new URLSearchParams();
    if (params.severity) query.append('severity', params.severity);
    if (params.unacknowledged_only) query.append('unacknowledged_only', 'true');
    if (params.limit) query.append('limit', String(params.limit));
    return this.request<AlertItem[]>(`/api/alerts?${query.toString()}`);
  }

  async getUnreadAlertCount(): Promise<{ unread_count: number }> {
    return this.request<{ unread_count: number }>('/api/alerts/unread-count');
  }

  async acknowledgeAlert(id: string): Promise<AlertItem> {
    return this.request<AlertItem>(`/api/alerts/${id}/ack`, {
      method: 'POST',
    });
  }

  async acknowledgeAllAlerts(): Promise<{ acknowledged_count: number }> {
    return this.request('/api/alerts/ack-all', {
      method: 'POST',
    });
  }

  // Device Endpoints
  async getDeviceStatus(): Promise<ConnectionInfo> {
    return this.request<ConnectionInfo>('/api/device/status');
  }

  async sendDeviceCommand(command: string): Promise<{ status: string; message: string }> {
    return this.request('/api/device/command', {
      method: 'POST',
      body: JSON.stringify({ command, target_device: 'ESP32-POND-01' }),
    });
  }

  async setReportingInterval(interval_seconds: number): Promise<any> {
    return this.request('/api/device/interval', {
      method: 'POST',
      body: JSON.stringify({ interval_seconds }),
    });
  }

  async getNotificationsStatus(): Promise<Record<string, any>> {
    return this.request('/api/device/notifications-status');
  }

  // MQTT Bridge Endpoints
  async getMqttStatus(): Promise<any> {
    return this.request('/api/mqtt/status');
  }

  async configureMqtt(topic: string): Promise<any> {
    return this.request('/api/mqtt/configure', {
      method: 'POST',
      body: JSON.stringify({ topic }),
    });
  }
}

export const api = new ApiClient();

