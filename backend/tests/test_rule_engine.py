import pytest
from app.engine.rule_engine import evaluate_readings
from app.engine.thresholds import PrawnPondThresholds

def test_safe_readings():
    """When all readings are within safe bounds, overall risk is LOW and 0 actions are recommended."""
    res = evaluate_readings(
        temperature=29.0,
        ph=7.6,
        dissolved_oxygen=6.2,
        turbidity=35.0,
        ammonia=0.04,
        water_level=1.3
    )
    assert res.overall_risk == "LOW"
    assert len(res.causes) == 0
    assert len(res.recommended_actions) == 0
    assert "SAFE" in res.summary_message

def test_low_do_alone():
    """Low DO (< 2.8 mg/L) triggers CRITICAL risk and aerator action, with no advice for other parameters."""
    res = evaluate_readings(
        temperature=29.0,
        ph=7.6,
        dissolved_oxygen=2.5,  # Critical low
        turbidity=35.0,
        ammonia=0.04,
        water_level=1.3
    )
    assert res.overall_risk == "CRITICAL"
    assert len(res.causes) == 1
    assert res.causes[0].parameter == "dissolved_oxygen"
    assert res.causes[0].rule_id == "RULE_DO_CRITICAL"
    
    # Only DO action recommended
    assert len(res.recommended_actions) == 1
    assert res.recommended_actions[0].trigger_cause == "dissolved_oxygen"
    assert "Aerator" in res.recommended_actions[0].title

def test_high_ammonia_alone():
    """High ammonia alone gives water exchange advice without unrelated advice."""
    res = evaluate_readings(
        temperature=29.0,
        ph=7.6,
        dissolved_oxygen=6.0,
        turbidity=35.0,
        ammonia=1.4,  # Critical lethal level
        water_level=1.3
    )
    assert res.overall_risk == "CRITICAL"
    assert any(c.parameter == "ammonia" for c in res.causes)
    
    # Verify recommended action mentions water exchange
    nh3_actions = [a for a in res.recommended_actions if a.trigger_cause == "ammonia"]
    assert len(nh3_actions) > 0
    assert "Water Exchange Advice" in nh3_actions[0].title

    # Unrelated parameters must NOT have advice
    assert not any(a.trigger_cause == "dissolved_oxygen" for a in res.recommended_actions)
    assert not any(a.trigger_cause == "turbidity" for a in res.recommended_actions)
    assert not any(a.trigger_cause == "water_level" for a in res.recommended_actions)

def test_combined_temperature_and_low_do():
    """Combined high temperature (>31°C) and low DO (<4.0 mg/L) triggers CRITICAL compound rule."""
    res = evaluate_readings(
        temperature=32.8,       # High heat
        ph=7.6,
        dissolved_oxygen=3.2,   # Hypoxia under heat
        turbidity=35.0,
        ammonia=0.04,
        water_level=1.3
    )
    assert res.overall_risk == "CRITICAL"
    compound_causes = [c for c in res.causes if c.parameter == "compound:temp_do"]
    assert len(compound_causes) == 1
    assert compound_causes[0].rule_id == "RULE_COMPOUND_HEAT_HYPOXIA"
    
    # Emergency aerator action triggered
    emergency_actions = [a for a in res.recommended_actions if a.action_id == "ACT_AERATOR_EMERGENCY"]
    assert len(emergency_actions) == 1
    assert emergency_actions[0].priority == "URGENT"

def test_unrelated_parameters_get_no_advice():
    """When only turbidity is high, only turbidity advice is issued."""
    res = evaluate_readings(
        temperature=29.0,
        ph=7.6,
        dissolved_oxygen=6.0,
        turbidity=85.0,  # Critical turbidity silt overload
        ammonia=0.03,
        water_level=1.3
    )
    assert any(c.parameter == "turbidity" for c in res.causes)
    assert not any(c.parameter == "dissolved_oxygen" for c in res.causes)
    assert not any(c.parameter == "ammonia" for c in res.causes)
    
    # Filter/Change water action present
    actions = [a for a in res.recommended_actions if a.trigger_cause == "turbidity"]
    assert len(actions) > 0
    assert "Change/Filter Water" in actions[0].title
    
    # Zero actions for other parameters
    other_actions = [a for a in res.recommended_actions if a.trigger_cause != "turbidity"]
    assert len(other_actions) == 0

def test_ph_out_of_range():
    """pH out of optimal range triggers pH warning/critical and buffer advice."""
    res = evaluate_readings(
        temperature=29.0,
        ph=6.0,  # Highly acidic
        dissolved_oxygen=6.0,
        turbidity=35.0,
        ammonia=0.04,
        water_level=1.3
    )
    assert res.overall_risk == "CRITICAL"
    assert any(c.parameter == "ph" for c in res.causes)
    assert any("pH" in a.title for a in res.recommended_actions)

