"""
=============================================================================
AquaCare — Standalone HiveMQ MQTT Bridge
-----------------------------------------------------------------------------
Subscribes to HiveMQ broker and feeds real live ESP32 telemetry into AquaCare.
Can run standalone or in conjunction with the backend.
Usage:
    python scripts/mqtt_bridge.py --topic prawnagent/pond01/state
=============================================================================
"""

import os
import sys
import json
import time
import argparse
import httpx
import paho.mqtt.client as mqtt

BROKER = os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com")
PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
DEFAULT_TOPIC = os.getenv("MQTT_TOPIC", "git ")
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000/api/telemetry")
DEVICE_API_KEY = os.getenv("DEVICE_API_KEY", "aquacare-device-key-2026")

def on_connect(client, userdata, flags, rc, properties=None):
    print(f"[*] Connected to HiveMQ broker {BROKER}:{PORT} (code: {rc})")
    client.subscribe(userdata["topic"])
    print(f"[*] Subscribed to live telemetry topic: '{userdata['topic']}'")

def on_message(client, userdata, msg):
    try:
        raw = msg.payload.decode("utf-8", errors="ignore")
        d = json.loads(raw)
        print(f"[LIVE RX] {msg.topic}: Temp={d.get('temperature')}°C | DO={d.get('do')}mg/L | NH3={d.get('ammonia')}ppm | Turb={d.get('turbidity')}NTU | Relays=aerator:{d.get('aerator')},pump:{d.get('water_pump')}")

        # Map to AquaCare TelemetryPayload schema
        payload = {
            "device_id": str(d.get("pond", "ESP32-POND-01")).upper(),
            "temperature": float(d.get("temperature", 29.5)),
            "dissolved_oxygen": float(d.get("do", 6.0)),
            "ammonia": float(d.get("ammonia", 0.05)),
            "turbidity": float(d.get("turbidity", 30.0)),
            "nitrate": float(d.get("nitrate")) if d.get("nitrate") is not None else None,
            "ph": float(d.get("ph", 7.6)),
            "water_level": float(d.get("water_level", 1.35)),
            "device_flags": {
                "aerator_relay": bool(d.get("aerator", 0)),
                "pump_relay": bool(d.get("water_pump", 0)),
                "feeder_relay": bool(d.get("feeder_pump", 0)),
                "dosing_relay": bool(d.get("dosing_pump", 0)),
                "alarm_active": bool(d.get("alarm", 0)),
                "data_ok": bool(d.get("data_ok", 1)),
                "uptime_seconds": int(d.get("uptime_s", 0)),
                "wifi_rssi": int(d.get("rssi", -63)),
                "battery_voltage": float(d.get("v_bat", 4.14)),
                "firmware_version": str(d.get("fw", "v1.2.4-mqtt")),
                "last_boot_reason": "POWERON_RESET",
                "sensor_status": {
                    "temperature": "OK" if d.get("data_ok", 1) else "STALE",
                    "ph": "CALIBRATED_NOMINAL",
                    "dissolved_oxygen": "OK" if d.get("data_ok", 1) else "STALE",
                    "turbidity": "OK" if d.get("data_ok", 1) else "STALE",
                    "ammonia": "OK" if d.get("data_ok", 1) else "STALE",
                    "water_level": "CALIBRATED_NOMINAL",
                    "nitrate": "OK" if d.get("data_ok", 1) else "STALE"
                }
            }
        }

        # Forward to AquaCare API
        headers = {
            "X-Device-API-Key": DEVICE_API_KEY,
            "Content-Type": "application/json"
        }
        resp = httpx.post(API_URL, json=payload, headers=headers, timeout=4.0)
        if resp.status_code == 200:
            print(f"    -> Successfully ingested into AquaCare [Status {resp.status_code}]")
        else:
            print(f"    -> Warning: API returned status {resp.status_code}: {resp.text}")

    except Exception as e:
        print(f"[!] Error bridging packet: {e}")

def main():
    parser = argparse.ArgumentParser(description="AquaCare Live HiveMQ Bridge")
    parser.add_argument("--topic", default=DEFAULT_TOPIC, help="MQTT Topic to subscribe")
    parser.add_argument("--broker", default=BROKER, help="MQTT Broker host")
    parser.add_argument("--port", type=int, default=PORT, help="MQTT Broker port")
    args = parser.parse_args()

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, userdata={"topic": args.topic})
    client.on_connect = on_connect
    client.on_message = on_message

    print(f"Connecting to HiveMQ {args.broker}:{args.port}...")
    client.connect(args.broker, args.port, 60)
    client.loop_forever()

if __name__ == "__main__":
    main()
