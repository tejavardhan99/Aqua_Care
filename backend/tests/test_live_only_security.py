import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_telemetry_requires_device_api_key():
    """Unauthenticated telemetry without X-Device-API-Key must be rejected with 401."""
    payload = {
        "device_id": "ESP32-TEST-01",
        "temperature": 29.0,
        "ph": 7.6,
        "dissolved_oxygen": 6.0,
        "turbidity": 35.0,
        "ammonia": 0.04,
        "water_level": 1.3
    }
    # No header
    res = client.post("/api/telemetry", json=payload)
    assert res.status_code == 401
    assert "X-Device-API-Key" in res.json()["detail"]

    # Invalid header
    res_invalid = client.post(
        "/api/telemetry",
        json=payload,
        headers={"X-Device-API-Key": "wrong-key"}
    )
    assert res_invalid.status_code == 401

def test_telemetry_valid_api_key_accepted():
    """Telemetry with valid X-Device-API-Key must be accepted with 200 OK."""
    payload = {
        "device_id": "ESP32-TEST-01",
        "temperature": 29.0,
        "ph": 7.6,
        "dissolved_oxygen": 6.0,
        "turbidity": 35.0,
        "ammonia": 0.04,
        "water_level": 1.3
    }
    res = client.post(
        "/api/telemetry",
        json=payload,
        headers={"X-Device-API-Key": settings.DEVICE_API_KEY}
    )
    assert res.status_code == 200
    assert res.json()["record"]["temperature"] == 29.0

def test_simulation_endpoint_disabled_in_live_only_mode():
    """POST /api/rules/evaluate must be blocked when ENABLE_SIMULATION=false."""
    settings.ENABLE_SIMULATION = False
    payload = {
        "temperature": 32.0,
        "ph": 7.6,
        "dissolved_oxygen": 2.5,
        "turbidity": 35.0,
        "ammonia": 0.04,
        "water_level": 1.3
    }
    res = client.post("/api/rules/evaluate", json=payload)
    assert res.status_code == 403
    assert "disabled" in res.json()["detail"].lower()

