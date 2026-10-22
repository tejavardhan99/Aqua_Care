"""
AquaCare ESP32 Mock Hardware Feeder
Emulates a real ESP32 edge microcontroller pushing telemetry to the FastAPI backend over HTTP POST.
Usage:
    python mock_esp32_feeder.py --interval 10 --url http://127.0.0.1:8000/api/telemetry
"""

import time
import math
import random
import argparse
import httpx
from datetime import datetime

def generate_telemetry(step: int, mode: str = "normal") -> dict:
    # Base diurnal oscillation
    t_hour = (step * 0.05) % 24.0
    hour_angle = (t_hour / 24.0) * 2 * math.pi
    
    # Natural prawn pond conditions
    base_temp = 29.4 + 1.2 * math.sin(hour_angle) + random.uniform(-0.15, 0.15)
    base_ph = 7.7 + 0.3 * math.sin(hour_angle) + random.uniform(-0.05, 0.05)
    base_do = 5.9 + 1.1 * math.sin(hour_angle) + random.uniform(-0.1, 0.1)
    base_turb = 33.0 + 3.0 * math.cos(hour_angle) + random.uniform(-1.0, 1.0)
    base_nh3 = max(0.01, 0.04 + 0.02 * math.sin(hour_angle + 1.0) + random.uniform(-0.01, 0.01))
    base_lvl = 1.35 + random.uniform(-0.01, 0.01)

    if mode == "hypoxia":
        base_do = 2.4  # Severe oxygen crash
        base_temp = 32.5
    elif mode == "ammonia_spike":
        base_nh3 = 1.25  # Toxic ammonia
        base_ph = 8.6
    elif mode == "turbidity_high":
        base_turb = 88.0

    return {
        "device_id": "ESP32-POND-01",
        "temperature": round(base_temp, 2),
        "ph": round(base_ph, 2),
        "dissolved_oxygen": round(base_do, 2),
        "turbidity": round(base_turb, 1),
        "ammonia": round(base_nh3, 3),
        "water_level": round(base_lvl, 2),
        "device_flags": {
            "aerator_relay": base_do < 3.5,
            "pump_relay": base_nh3 > 0.8 or base_lvl < 0.9,
            "wifi_rssi": random.randint(-72, -60),
            "battery_voltage": round(4.18 - (step * 0.0001), 2),
            "uptime_seconds": step * 10 + 3600,
            "firmware_version": "v1.2.4",
            "last_boot_reason": "POWERON_RESET",
            "sensor_status": {
                "temperature": "OK",
                "ph": "OK",
                "dissolved_oxygen": "OK",
                "turbidity": "OK",
                "ammonia": "OK",
                "water_level": "OK"
            }
        }
    }

def main():
    parser = argparse.ArgumentParser(description="AquaCare ESP32 Mock Telemetry Feeder")
    parser.add_argument("--url", default="http://127.0.0.1:8000/api/telemetry", help="Target API URL")
    parser.add_argument("--interval", type=int, default=10, help="Reporting interval in seconds")
    parser.add_argument("--mode", default="normal", choices=["normal", "hypoxia", "ammonia_spike", "turbidity_high"])
    parser.add_argument("--count", type=int, default=0, help="Number of packets to send (0 = infinite)")
    args = parser.parse_args()

    print(f"==================================================")
    print(f" AquaCare ESP32 Telemetry Feeder Started")
    print(f" Target URL : {args.url}")
    print(f" Interval   : {args.interval}s")
    print(f" Mode       : {args.mode}")
    print(f"==================================================")

    step = 0
    headers = {
        "Content-Type": "application/json",
        "X-Device-API-Key": "aquacare-device-key-2026"
    }
    with httpx.Client(timeout=5.0, headers=headers) as client:
        while True:
            step += 1
            payload = generate_telemetry(step, mode=args.mode)
            try:
                res = client.post(args.url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    eval_data = data.get("evaluation", {})
                    risk = eval_data.get("overall_risk", "UNKNOWN")
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Packet #{step} -> DO: {payload['dissolved_oxygen']} mg/L, Temp: {payload['temperature']}°C, TAN: {payload['ammonia']} ppm | Risk: {risk} | Status: {res.status_code}")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] HTTP Error: {res.status_code} - {res.text}")
            except Exception as e:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection failed: {e}")

            if args.count > 0 and step >= args.count:
                break
            time.sleep(args.interval)

if __name__ == "__main__":
    main()

