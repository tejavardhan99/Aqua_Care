import pytest
from app.engine.rule_engine import evaluate_readings
from app.engine.deduplicator import AlertDeduplicator
from app.storage.db import TelemetryStore
from app.models.telemetry import TelemetryPayload

def test_simulation_status_would_trigger():
    """Simulation mode must label all recommended actions as 'Would trigger'."""
    res = evaluate_readings(
        temperature=32.0,
        ph=8.0,
        dissolved_oxygen=2.4,  # Critical
        turbidity=40.0,
        ammonia=0.05,
        water_level=1.3,
        is_simulation=True
    )
    assert res.is_simulation is True
    assert len(res.recommended_actions) > 0
    for action in res.recommended_actions:
        assert action.status == "Would trigger"

def test_simulation_does_not_mutate_telemetry_store():
    """Simulated values must NEVER pollute or overwrite live telemetry records."""
    store = TelemetryStore()
    
    # Store real reading
    real_payload = TelemetryPayload(
        device_id="ESP32-REAL-01",
        temperature=29.1,
        ph=7.5,
        dissolved_oxygen=5.9,
        turbidity=30.0,
        ammonia=0.03,
        water_level=1.35
    )
    store.add_reading(real_payload)
    latest_before = store.get_latest_reading()
    assert latest_before.temperature == 29.1

    # Simulate an extreme crash scenario (e.g. temp 38°C, DO 1.2 mg/L)
    sim_eval = evaluate_readings(
        temperature=38.0,
        ph=9.5,
        dissolved_oxygen=1.2,
        turbidity=95.0,
        ammonia=3.0,
        water_level=0.4,
        is_simulation=True
    )
    assert sim_eval.overall_risk == "CRITICAL"

    # Verify live store is untouched
    latest_after = store.get_latest_reading()
    assert latest_after.temperature == 29.1
    assert latest_after.dissolved_oxygen == 5.9
    assert latest_after.device_id == "ESP32-REAL-01"

def test_simulation_alerts_never_persisted_to_real_alert_log():
    """Simulated evaluation must never inject items into real alert history."""
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    assert len(deduplicator.get_alerts()) == 0

    # Evaluate simulated emergency
    sim_eval = evaluate_readings(
        temperature=34.0,
        ph=8.8,
        dissolved_oxygen=2.1,
        turbidity=40.0,
        ammonia=0.05,
        water_level=1.3,
        is_simulation=True
    )
    sim_alerts = deduplicator.process_evaluation(sim_eval, pond_id="pond-sim")
    
    # Simulation alerts generated for immediate preview
    assert len(sim_alerts) > 0
    for a in sim_alerts:
        assert a.is_simulation is True

    # Real alert registry remains empty
    assert len(deduplicator.get_alerts()) == 0
    assert len(deduplicator.get_alerts(pond_id="pond-sim")) == 0

