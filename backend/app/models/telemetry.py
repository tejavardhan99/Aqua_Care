from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
from datetime import datetime
from enum import Enum

class ConnectionStatus(str, Enum):
    CONNECTED = "CONNECTED"
    STALE = "STALE"
    DISCONNECTED = "DISCONNECTED"
    UNKNOWN = "UNKNOWN"

class DeviceSensorStatus(BaseModel):
    temperature: str = "OK"
    ph: str = "OK"
    dissolved_oxygen: str = "OK"
    turbidity: str = "OK"
    ammonia: str = "OK"
    water_level: str = "OK"
    nitrate: str = "OK"

class DeviceFlags(BaseModel):
    aerator_relay: bool = False
    pump_relay: bool = False
    feeder_relay: bool = False
    dosing_relay: bool = False
    alarm_active: bool = False
    data_ok: bool = True
    wifi_rssi: int = -65
    battery_voltage: float = 4.12
    uptime_seconds: int = 120
    firmware_version: str = "v1.2.4"
    last_boot_reason: str = "POWERON_RESET"
    sensor_status: DeviceSensorStatus = Field(default_factory=DeviceSensorStatus)

class TelemetryPayload(BaseModel):
    device_id: str = "ESP32-POND-01"
    temperature: float = Field(..., ge=0.0, le=50.0, description="Temperature in °C")
    ph: Optional[float] = Field(default=7.6, ge=0.0, le=14.0, description="pH level (0-14)")
    dissolved_oxygen: float = Field(..., ge=0.0, le=25.0, description="Dissolved Oxygen in mg/L")
    turbidity: float = Field(..., ge=0.0, le=1000.0, description="Turbidity in NTU")
    ammonia: float = Field(..., ge=0.0, le=20.0, description="Ammonia in ppm")
    water_level: Optional[float] = Field(default=1.35, ge=0.0, le=10.0, description="Water Level in m")
    nitrate: Optional[float] = Field(default=None, description="Nitrate in mg/L")
    device_flags: Optional[DeviceFlags] = None
    timestamp: Optional[datetime] = None

class TelemetryRecord(TelemetryPayload):
    id: str
    received_at: datetime
    is_stale: bool = False
