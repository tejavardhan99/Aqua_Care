import asyncio
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Callable
import paho.mqtt.client as mqtt

from app.models.telemetry import (
    TelemetryPayload,
    TelemetryRecord,
    DeviceFlags,
    DeviceSensorStatus
)
from app.engine.rule_engine import evaluate_readings
from app.engine.deduplicator import alert_manager
from app.storage.db import telemetry_store
from app.config import settings

logger = logging.getLogger("aquacare.mqtt")

class MqttService:
    def __init__(self):
        self.client: Optional[mqtt.Client] = None
        self.broker_host: str = settings.MQTT_BROKER_HOST
        self.broker_port: int = settings.MQTT_BROKER_PORT
        self.topic: str = settings.MQTT_TOPIC
        self.is_connected: bool = False
        self.status: str = "INITIALIZING"
        self.packets_received: int = 0
        self.last_packet_time: Optional[datetime] = None
        self.last_payload: Optional[Dict[str, Any]] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._broadcast_fn: Optional[Callable] = None

    def set_broadcast_fn(self, fn: Callable):
        self._broadcast_fn = fn

    def start(self, loop: Optional[asyncio.AbstractEventLoop] = None):
        if not settings.MQTT_ENABLED:
            logger.info("MQTT Service disabled via settings.")
            self.status = "DISABLED"
            return

        self._loop = loop or asyncio.get_event_loop()
        self.status = "CONNECTING"
        logger.info(f"Connecting to MQTT Broker {self.broker_host}:{self.broker_port} on topic '{self.topic}'...")

        try:
            self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message
            self.client.reconnect_delay_set(min_delay=1, max_delay=10)

            self.client.connect(self.broker_host, self.broker_port, keepalive=60)
            self.client.loop_start()
            logger.info("MQTT Client loop started in background thread.")
        except Exception as e:
            self.status = f"ERROR: {str(e)}"
            logger.error(f"Failed to connect to MQTT broker: {e}")

    def stop(self):
        if self.client:
            logger.info("Stopping MQTT client loop...")
            try:
                self.client.loop_stop()
                self.client.disconnect()
            except Exception as e:
                logger.warning(f"Error disconnecting MQTT client: {e}")
            self.is_connected = False
            self.status = "STOPPED"

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        logger.info(f"Connected to MQTT broker with result code: {rc}")
        self.is_connected = True
        self.status = "CONNECTED"
        client.subscribe(self.topic)
        logger.info(f"Subscribed to topic: {self.topic}")

    def _on_disconnect(self, client, userdata, disconnect_flags, rc, properties=None):
        logger.warning(f"Disconnected from MQTT broker with code: {rc}")
        self.is_connected = False
        self.status = "DISCONNECTED"

    def _on_message(self, client, userdata, msg):
        try:
            payload_str = msg.payload.decode("utf-8", errors="ignore")
            data = json.loads(payload_str)
            self._process_message(data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode MQTT JSON payload: {e}")
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}", exc_info=True)

    def _process_message(self, d: Dict[str, Any]):
        """
        Translates incoming ESP32 HiveMQ payload into AquaCare TelemetryPayload,
        evaluates against prawn biology rules, manages deduplicated alerts,
        and broadcasts to UI clients.
        """
        now = datetime.utcnow()
        self.last_packet_time = now
        self.packets_received += 1
        self.last_payload = d

        # Map metrics
        # ESP32 keys: temperature, do, ammonia, turbidity, nitrate, aerator, water_pump, feeder_pump, dosing_pump, alarm, data_ok, uptime_s
        temp = float(d.get("temperature", 29.5))
        do_val = float(d.get("do", 6.0))
        ammonia_val = float(d.get("ammonia", 0.05))
        turbidity_val = float(d.get("turbidity", 30.0))
        nitrate_val = float(d.get("nitrate")) if d.get("nitrate") is not None else None
        ph_val = float(d.get("ph", 7.6))
        water_level_val = float(d.get("water_level", 1.35))
        device_id = str(d.get("pond", "ESP32-POND-01")).upper()
        if not device_id.startswith("ESP32-"):
            device_id = f"ESP32-{device_id}"

        data_ok = bool(d.get("data_ok", 1))

        device_flags = DeviceFlags(
            aerator_relay=bool(d.get("aerator", 0)),
            pump_relay=bool(d.get("water_pump", 0)),
            feeder_relay=bool(d.get("feeder_pump", 0)),
            dosing_relay=bool(d.get("dosing_pump", 0)),
            alarm_active=bool(d.get("alarm", 0)),
            data_ok=data_ok,
            wifi_rssi=int(d.get("rssi", -63)),
            battery_voltage=float(d.get("v_bat", 4.14)),
            uptime_seconds=int(d.get("uptime_s", 0)),
            firmware_version=str(d.get("fw", "v1.2.4-mqtt")),
            last_boot_reason="POWERON_RESET",
            sensor_status=DeviceSensorStatus(
                temperature="OK" if data_ok else "STALE",
                ph="CALIBRATED_NOMINAL" if "ph" not in d else ("OK" if data_ok else "STALE"),
                dissolved_oxygen="OK" if data_ok else "STALE",
                turbidity="OK" if data_ok else "STALE",
                ammonia="OK" if data_ok else "STALE",
                water_level="CALIBRATED_NOMINAL" if "water_level" not in d else ("OK" if data_ok else "STALE"),
                nitrate="OK" if data_ok else "STALE",
            )
        )

        payload = TelemetryPayload(
            device_id=device_id,
            temperature=temp,
            ph=ph_val,
            dissolved_oxygen=do_val,
            turbidity=turbidity_val,
            ammonia=ammonia_val,
            water_level=water_level_val,
            nitrate=nitrate_val,
            device_flags=device_flags,
            timestamp=now
        )

        # 1. Ingest into telemetry store
        record = telemetry_store.add_reading(payload)

        # 2. Evaluate with single source of truth rule engine
        evaluation = evaluate_readings(
            temperature=record.temperature,
            ph=record.ph,
            dissolved_oxygen=record.dissolved_oxygen,
            turbidity=record.turbidity,
            ammonia=record.ammonia,
            water_level=record.water_level,
            is_simulation=False
        )

        # 3. Process alert generation with cooldown and deduplication
        new_alerts = alert_manager.process_evaluation(
            evaluation=evaluation,
            pond_id="pond-01",
            user_id="user-default"
        )

        # 4. Connection status
        conn_status = telemetry_store.get_connection_status()

        response_data = {
            "record": record.dict(),
            "evaluation": evaluation.dict(),
            "new_alerts_count": len(new_alerts),
            "connection": conn_status,
            "mqtt": {
                "broker": f"{self.broker_host}:{self.broker_port}",
                "topic": self.topic,
                "packets_received": self.packets_received
            }
        }

        # 5. Broadcast to WebSocket subscribers
        if self._broadcast_fn and self._loop and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self._broadcast_fn({
                    "type": "TELEMETRY_UPDATE",
                    "data": response_data
                }),
                self._loop
            )

    def get_status(self) -> Dict[str, Any]:
        return {
            "enabled": settings.MQTT_ENABLED,
            "status": self.status,
            "is_connected": self.is_connected,
            "broker": f"{self.broker_host}:{self.broker_port}",
            "topic": self.topic,
            "packets_received": self.packets_received,
            "last_packet_time": self.last_packet_time.isoformat() if self.last_packet_time else None,
            "last_payload": self.last_payload
        }

    def update_topic(self, new_topic: str):
        if not new_topic:
            return
        old_topic = self.topic
        self.topic = new_topic.strip()
        if self.client and self.is_connected:
            self.client.unsubscribe(old_topic)
            self.client.subscribe(self.topic)
            logger.info(f"MQTT switched topic from '{old_topic}' to '{self.topic}'")

mqtt_service = MqttService()
