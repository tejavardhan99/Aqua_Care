import pytest
from datetime import datetime, timedelta
from app.engine.deduplicator import AlertDeduplicator
from app.engine.rule_engine import evaluate_readings

def test_alert_created_on_first_trigger():
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    
    # First reading with low DO (3.2 mg/L -> HIGH)
    eval1 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts1 = deduplicator.process_evaluation(eval1, pond_id="pond-01")
    assert len(alerts1) == 1
    assert alerts1[0].severity == "HIGH"
    assert alerts1[0].parameter == "dissolved_oxygen"
    assert len(deduplicator.get_alerts()) == 1

def test_alert_deduplication_suppresses_repeat_within_cooldown():
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    
    # 1st reading (starts condition)
    eval1 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts1 = deduplicator.process_evaluation(eval1, pond_id="pond-01")
    assert len(alerts1) == 1

    # 2nd reading 10 seconds later with same HIGH condition
    eval2 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.1,  # still HIGH
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts2 = deduplicator.process_evaluation(eval2, pond_id="pond-01")
    # Must be deduplicated! No new alert.
    assert len(alerts2) == 0
    assert len(deduplicator.get_alerts()) == 1

def test_severity_escalation_bypasses_cooldown():
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    
    # 1st reading: HIGH severity (3.2 mg/L)
    eval1 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts1 = deduplicator.process_evaluation(eval1, pond_id="pond-01")
    assert len(alerts1) == 1
    assert alerts1[0].severity == "HIGH"

    # 2nd reading: drops to CRITICAL (<2.8 mg/L) 30 seconds later
    eval2 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=2.4,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts2 = deduplicator.process_evaluation(eval2, pond_id="pond-01")
    # Must generate new alert immediately due to severity change!
    assert len(alerts2) >= 1
    assert any(a.severity == "CRITICAL" for a in alerts2)
    assert len(deduplicator.get_alerts()) >= 2

def test_cooldown_expiry_triggers_repeat_alert():
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    
    # 1st reading
    eval1 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts1 = deduplicator.process_evaluation(eval1, pond_id="pond-01")
    assert len(alerts1) == 1

    # Fast-forward condition timestamp by 601 seconds
    key = ("pond-01", "RULE_DO_HIGH")
    assert key in deduplicator._active_conditions
    deduplicator._active_conditions[key].last_alert_time = datetime.utcnow() - timedelta(seconds=601)

    # Subsequent reading after cooldown
    eval2 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    alerts2 = deduplicator.process_evaluation(eval2, pond_id="pond-01")
    assert len(alerts2) == 1
    assert len(deduplicator.get_alerts()) == 2

def test_condition_resolution_and_recovery():
    deduplicator = AlertDeduplicator(cooldown_seconds=600)
    
    # Trigger issue
    eval1 = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=3.2,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    deduplicator.process_evaluation(eval1, pond_id="pond-01")
    assert len(deduplicator.get_active_conditions("pond-01")) > 0

    # Normal safe reading arrives
    eval_safe = evaluate_readings(
        temperature=29.0, ph=7.6, dissolved_oxygen=6.0,
        turbidity=35.0, ammonia=0.04, water_level=1.3
    )
    deduplicator.process_evaluation(eval_safe, pond_id="pond-01")
    # Active condition should now be cleared
    assert len(deduplicator.get_active_conditions("pond-01")) == 0

