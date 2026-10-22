"""
=============================================================================
AquaCare — Dev-Only Standalone ESP32 Mock Telemetry Generator
-----------------------------------------------------------------------------
DEV-ONLY TESTING TOOL — STRICTLY FOR DEVELOPMENT & CI/CD VERIFICATION
NEVER IMPORT OR REFERENCE THIS SCRIPT FROM CLIENT BROWSER CODE
-----------------------------------------------------------------------------
Usage:
    python scripts/mock_esp32.py --mode safe --count 1
    python scripts/mock_esp32.py --mode warning --interval 10
    python scripts/mock_esp32.py --mode critical --count 1
=============================================================================
"""

import os
import sys
import time
import math
import random
import argparse
import httpx
from datetime import datetime

DEFAULT_API_KEY = os.getenv("DEVICE_API_KEY", "aquacare-device-key-2026")
DEFAULT_URL = os.getenv("API_URL", "http://127.0.0.1:8000/api/telemetry")

def generate_telemetry_packet(step: int, mode: str = "safe") -> dict:
    """
    Generates realistic biological pond telemetry calibrated for
    Giant Freshwater Prawns (Macrobrachium rosenbergii).
    """
    # Diurnal variation cycle (24 hour)
    t_hour = (step * 0.05) % 24.0
    hour_angle = (t_hour / 24.0) * 2 * math.pi
    
    # 1. Safe / Optimal Prawn Habitat (Baseline)
    # Safe ranges: Temp 27-31°C, DO > 5.0 mg/L, pH 7.2-8.4, Ammonia < 0.1 ppm, Turbidity 25-50 NTU, Depth 1.1-1.6 m
    temp = 29.2 + 0.8 * math.sin(hour_angle) + random.uniform(-0.1, 0.1)
    ph = 7.65 + 0.2 * math.sin(hour_angle) + random.uniform(-0.05, 0.05)
    do = 5.8 + 0.8 * math.sin(hour_angle) + random.uniform(-0.1, 0.1)
    turb = 35.0 + 3.0 * math.cos(hour_angle) + random.uniform(-1.0, 1.0)
    nh3 = max(0.015, 0.04 + 0.015 * math.sin(hour_angle) + random.uniform(-0.005, 0.005))
    depth = 1.35 + random.uniform(-0.01, 0.01)

    # 2. Warning Scenario (Sub-optimal, action advised)
    if mode == "warning":
        do = 4.3  # DO sub-optimal (< 5.0 mg/L)
        turb = 58.0  # Turbidity warning (> 50 NTU)
        temp = 30.8

    # 3. Critical Scenario (Severe biological hazard)
    elif mode == "critical":
        do = 2.35  # Severe Hypoxia (< 2.8 mg/L)
        temp = 32.4 # High heat compounding hypoxia
        nh3 = 0.65  # Elevated toxic ammonia

    return {
        "device_id": "ESP32-POND-01",
        "temperature": round(temp, 2),
        "ph": round(ph, 2),
        "dissolved_oxygen": round(do, 2),
        "turbidity": round(turb, 1),
        "ammonia": round(nh3, 3),
        "water_level": round(depth, 2),
        "device_flags": {
            "aerator_relay": do < 3.5,
            "pump_relay": nh3 > 0.8 or depth < 0.9,
            "wifi_rssi": random.randint(-70, -58),
            "battery_voltage": round(4.2 - (step * 0.0001), 2),
            "uptime_seconds": step * 10 + 7200,
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
    parser = argparse.ArgumentParser(description="AquaCare Dev-Only ESP32 Mock Feeder")
    parser.add_argument("--url", default=DEFAULT_URL, help="Target API telemetry endpoint URL")
    parser.add_argument("--api-key", default=DEFAULT_API_KEY, help="Hardware Edge X-Device-API-Key")
    parser.add_argument("--mode", default="safe", choices=["safe", "warning", "critical", "normal", "hypoxia"])
    parser.add_argument("--interval", type=int, default=10, help="Reporting interval in seconds")
    parser.add_argument("--count", type=int, default=0, help="Number of packets to send (0 = continuous)")
    args = parser.parse_args()

    # Normalize aliases
    mode_map = {
        "normal": "safe",
        "hypoxia": "critical",
        "safe": "safe",
        "warning": "warning",
        "critical": "critical"
    }
    selected_mode = mode_map.get(args.mode, "safe")

    print(f"============================================================")
    print(f" AquaCare Dev-Only ESP32 Edge Feeder")
    print(f" Target Endpoint: {args.url}")
    print(f" Mode Scenario  : {selected_mode.upper()}")
    print(f" Interval       : {args.interval}s")
    print(f" Authentication : X-Device-API-Key {'*' * (len(args.api_key) - 4) + args.api_key[-4:] if len(args.api_key) > 4 else '***'}")
    print(f"============================================================")

    step = 0
    headers = {
        "Content-Type": "application/json",
        "X-Device-API-Key": args.api_key
    }

    with httpx.Client(timeout=6.0, headers=headers) as client:
        while True:
            step += 1
            payload = generate_telemetry_packet(step, mode=selected_mode)
            timestamp_str = datetime.now().strftime("%H:%M:%S")

            try:
                res = client.post(args.url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    eval_data = data.get("evaluation", {})
                    risk = eval_data.get("overall_risk", "UNKNOWN")
                    new_alerts = data.get("new_alerts_count", 0)
                    print(f"[{timestamp_str}] Packet #{step} -> DO: {payload['dissolved_oxygen']} mg/L, Temp: {payload['temperature']}°C, TAN: {payload['ammonia']} ppm | Risk: {risk} | New Alerts: {new_alerts} | Status: 200 OK")
                elif res.status_code == 401:
                    print(f"[{timestamp_str}] AUTH ERROR 401: Invalid X-Device-API-Key. Rejected by backend security.")
                    break
                else:
                    print(f"[{timestamp_str}] HTTP Error {res.status_code}: {res.text}")
            except Exception as e:
                print(f"[{timestamp_str}] Network connection failed: {e}")

            if args.count > 0 and step >= args.count:
                print(f"\nCompleted {args.count} packet transmission(s). Exiting.")
                break

            time.sleep(args.interval)

if __name__ == "__main__":
    main()

