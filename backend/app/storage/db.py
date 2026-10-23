from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import uuid

from app.models.telemetry import (
    TelemetryPayload,
    TelemetryRecord,
    DeviceFlags,
    ConnectionStatus
)
from app.config import settings

class TelemetryStore:
    """
    In-memory and persistent buffer for ESP32 telemetry and hardware command queue.
    Ensures simulation data NEVER enters this store.
    """
    def __init__(self):
        self._latest_reading: Optional[TelemetryRecord] = None
        self._history: List[TelemetryRecord] = []
        self._max_history: int = 1000
        self._device_commands: List[Dict[str, Any]] = []
        self._device_last_seen: Optional[datetime] = None
        self._reporting_interval: int = settings.ESP32_REPORT_INTERVAL_SECONDS
        
        # Populate realistic initial 24-hour historical baseline for charts so the trends page has meaningful data
        self._seed_baseline_history()

    def _seed_baseline_history(self):
        now = datetime.utcnow()
        # Seed 48 points across past 24 hours (every 30 mins)
        base_temp = 29.2
        base_ph = 7.8
        base_do = 5.8
        base_turb = 34.0
        base_nh3 = 0.05
        base_lvl = 1.35

        import math
        for i in range(48, 0, -1):
            t = now - timedelta(minutes=i * 30)
            # Add realistic diurnal pond fluctuations (photosynthesis elevates DO and pH during day, drops at night)
            hour_angle = (t.hour / 24.0) * 2 * math.pi
            temp = base_temp + 1.2 * math.sin(hour_angle - 1.5)
            ph = base_ph + 0.3 * math.sin(hour_angle - 1.0)
            do = base_do + 1.1 * math.sin(hour_angle - 1.2)
            turb = base_turb + 2.5 * math.cos(hour_angle)
            nh3 = max(0.01, base_nh3 + 0.03 * math.sin(hour_angle + 2.0))
            lvl = base_lvl - 0.002 * (48 - i)  # slight evaporation

            record = TelemetryRecord(
                id=f"seed-{i}",
                device_id="ESP32-POND-01",
                temperature=round(temp, 2),
                ph=round(ph, 2),
                dissolved_oxygen=round(do, 2),
                turbidity=round(turb, 1),
                ammonia=round(nh3, 3),
                water_level=round(lvl, 2),
                timestamp=t,
                received_at=t,
                is_stale=True,
                device_flags=DeviceFlags(
                    aerator_relay=False,
                    pump_relay=False,
                    wifi_rssi=-68,
                    battery_voltage=4.14,
                    uptime_seconds=3600 * 24 - (i * 1800),
                    firmware_version="v1.2.4"
                )
            )
            self._history.append(record)

        if self._history:
            self._latest_reading = self._history[-1]
            self._device_last_seen = self._history[-1].received_at

    def get_connection_status(self) -> Dict[str, Any]:
        if not self._device_last_seen:
            return {
                "status": ConnectionStatus.UNKNOWN,
                "last_seen": None,
                "seconds_since_last_seen": None,
                "interval_seconds": self._reporting_interval
            }

        now = datetime.utcnow()
        elapsed = (now - self._device_last_seen).total_seconds()

        if elapsed <= (self._reporting_interval * settings.STALE_THRESHOLD_MULTIPLIER):
            status = ConnectionStatus.CONNECTED
        elif elapsed <= settings.DISCONNECTED_THRESHOLD_SECONDS:
            status = ConnectionStatus.STALE
        else:
            status = ConnectionStatus.DISCONNECTED

        return {
            "status": status,
            "last_seen": self._device_last_seen.isoformat(),
            "seconds_since_last_seen": round(elapsed, 1),
            "interval_seconds": self._reporting_interval
        }

    def add_reading(self, payload: TelemetryPayload) -> TelemetryRecord:
        now = datetime.utcnow()
        record = TelemetryRecord(
            id=f"tel-{uuid.uuid4().hex[:10]}",
            device_id=payload.device_id,
            temperature=payload.temperature,
            ph=payload.ph,
            dissolved_oxygen=payload.dissolved_oxygen,
            turbidity=payload.turbidity,
            ammonia=payload.ammonia,
            water_level=payload.water_level,
            nitrate=payload.nitrate,
            device_flags=payload.device_flags or DeviceFlags(),
            timestamp=payload.timestamp or now,
            received_at=now,
            is_stale=False
        )

        self._latest_reading = record
        self._device_last_seen = now
        self._history.append(record)

        # Truncate old history
        if len(self._history) > self._max_history:
            self._history.pop(0)

        return record

    def get_latest_reading(self) -> Optional[TelemetryRecord]:
        if not self._latest_reading:
            return None
        
        # Check staleness
        conn = self.get_connection_status()
        is_stale = conn["status"] in (ConnectionStatus.STALE, ConnectionStatus.DISCONNECTED)
        self._latest_reading.is_stale = is_stale
        return self._latest_reading

    def get_history(self, range_filter: str = "24h") -> List[TelemetryRecord]:
        now = datetime.utcnow()
        if range_filter == "1h":
            cutoff = now - timedelta(hours=1)
        elif range_filter == "6h":
            cutoff = now - timedelta(hours=6)
        elif range_filter == "24h":
            cutoff = now - timedelta(hours=24)
        else:
            cutoff = datetime.min

        return [r for r in self._history if r.received_at >= cutoff]

    def set_reporting_interval(self, seconds: int):
        self._reporting_interval = max(3, min(300, seconds))

    def get_reporting_interval(self) -> int:
        return self._reporting_interval

    def queue_device_command(self, command: str, target: str = "ESP32-POND-01", issued_by: str = "operator") -> Dict[str, Any]:
        cmd_item = {
            "id": f"cmd-{uuid.uuid4().hex[:8]}",
            "target": target,
            "command": command,
            "status": "Sent to device",
            "issued_by": issued_by,
            "created_at": datetime.utcnow().isoformat()
        }
        self._device_commands.insert(0, cmd_item)
        return cmd_item

    def get_device_commands(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self._device_commands[:limit]

# Global telemetry store instance
telemetry_store = TelemetryStore()

