from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.rules import (
    RuleEvaluationResult,
    RuleCause,
    RecommendedAction,
    RiskLevel,
    ActionPriority,
    ActionStatus
)
from app.engine.thresholds import PrawnPondThresholds, get_current_thresholds

def evaluate_readings(
    temperature: float,
    ph: Optional[float] = 7.6,
    dissolved_oxygen: float = 0.0,
    turbidity: float = 0.0,
    ammonia: float = 0.0,
    water_level: Optional[float] = 1.35,
    is_simulation: bool = False,
    custom_thresholds: Optional[PrawnPondThresholds] = None
) -> RuleEvaluationResult:
    """
    Single source of truth rule evaluation engine.
    Used for both live incoming ESP32 telemetry and operator simulation lab.
    Evaluates compound and single-parameter rules against prawn pond thresholds.
    """
    if ph is None:
        ph = 7.6
    if water_level is None:
        water_level = 1.35
    thresholds = custom_thresholds or get_current_thresholds()
    causes: List[RuleCause] = []
    actions: List[RecommendedAction] = []
    
    # ----------------------------------------------------
    # 1. COMPOUND RULES (HIGH PRIORITY MULTI-PARAM RISK)
    # ----------------------------------------------------
    
    # Compound Rule 1: High Temperature + Low DO (Extreme Hypoxia Hazard)
    # Warm water cannot hold dissolved oxygen and accelerates prawn oxygen consumption
    if temperature > 31.0 and dissolved_oxygen < 4.0:
        causes.append(RuleCause(
            rule_id="RULE_COMPOUND_HEAT_HYPOXIA",
            rule_name="Heat-Induced Severe Hypoxia",
            parameter="compound:temp_do",
            measured_value=round(dissolved_oxygen, 2),
            threshold_limit="Temp > 31.0°C and DO < 4.0 mg/L",
            unit="mg/L & °C",
            severity="CRITICAL",
            description=f"Water temp is elevated ({temperature:.1f}°C) and DO is dangerously low ({dissolved_oxygen:.2f} mg/L). Prawn metabolism accelerates while oxygen solubility is severely reduced."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_AERATOR_EMERGENCY",
            title="Turn ON Primary & Emergency Aerators",
            description="Activate all paddlewheel aerators immediately. Halt feeding to minimize biological oxygen demand.",
            priority="URGENT",
            trigger_cause="compound:temp_do",
            device_command="RELAY_AERATOR_ON",
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # Compound Rule 2: High Ammonia + High pH (Toxic Un-ionized NH3 Gas Spike)
    # At high pH (>8.2), harmless ammonium ion NH4+ converts to lethal un-ionized ammonia NH3
    if ammonia > 0.5 and ph > 8.2:
        causes.append(RuleCause(
            rule_id="RULE_COMPOUND_TOXIC_AMMONIA",
            rule_name="Alkaline Ammonia Toxicity Hazard",
            parameter="compound:nh3_ph",
            measured_value=round(ammonia, 2),
            threshold_limit="Ammonia > 0.5 ppm and pH > 8.2",
            unit="ppm & pH",
            severity="CRITICAL",
            description=f"High pH ({ph:.2f}) converts ammonium into highly lethal un-ionized ammonia (NH3) gas ({ammonia:.2f} ppm), inducing severe gill necrosis in prawns."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_WATER_FLUSH_URGENT",
            title="Urgent 25% Pond Water Exchange",
            description="Flush 20-30% of pond water with clean freshwater, cease feed distribution, and apply bio-zeolite.",
            priority="URGENT",
            trigger_cause="compound:nh3_ph",
            device_command="RELAY_PUMP_ON",
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # ----------------------------------------------------
    # 2. INDIVIDUAL PARAMETER RULES
    # ----------------------------------------------------

    # Dissolved Oxygen Rules
    t_do = thresholds.dissolved_oxygen
    if dissolved_oxygen < t_do.critical:
        causes.append(RuleCause(
            rule_id="RULE_DO_CRITICAL",
            rule_name="Critical Dissolved Oxygen Deficit",
            parameter="dissolved_oxygen",
            measured_value=round(dissolved_oxygen, 2),
            threshold_limit=f"< {t_do.critical} {t_do.unit}",
            unit=t_do.unit,
            severity="CRITICAL",
            description=f"DO ({dissolved_oxygen:.2f} mg/L) is below emergency limit of {t_do.critical} mg/L. Prawns risk suffocation within 1-2 hours."
        ))
        # Add aerator action if not already added by compound rule
        if not any(a.action_id == "ACT_AERATOR_EMERGENCY" for a in actions):
            actions.append(RecommendedAction(
                action_id="ACT_AERATOR_ON",
                title="Turn ON Aerator",
                description="Turn ON primary pond aerator and sound technician alert.",
                priority="URGENT",
                trigger_cause="dissolved_oxygen",
                device_command="RELAY_AERATOR_ON",
                status="Would trigger" if is_simulation else "Suggested only"
            ))
    elif dissolved_oxygen < t_do.high:
        causes.append(RuleCause(
            rule_id="RULE_DO_HIGH",
            rule_name="High Risk Hypoxia Alert",
            parameter="dissolved_oxygen",
            measured_value=round(dissolved_oxygen, 2),
            threshold_limit=f"< {t_do.high} {t_do.unit}",
            unit=t_do.unit,
            severity="HIGH",
            description=f"DO ({dissolved_oxygen:.2f} mg/L) is below safe benthic threshold of {t_do.high} mg/L."
        ))
        if not any(a.action_id in ("ACT_AERATOR_EMERGENCY", "ACT_AERATOR_ON") for a in actions):
            actions.append(RecommendedAction(
                action_id="ACT_AERATOR_ON",
                title="Turn ON Aerator",
                description="Activate pond aeration to raise DO back into optimal prawn growth range (>5.0 mg/L).",
                priority="HIGH",
                trigger_cause="dissolved_oxygen",
                device_command="RELAY_AERATOR_ON",
                status="Would trigger" if is_simulation else "Suggested only"
            ))
    elif dissolved_oxygen < t_do.warning:
        causes.append(RuleCause(
            rule_id="RULE_DO_WARNING",
            rule_name="Sub-optimal Dissolved Oxygen",
            parameter="dissolved_oxygen",
            measured_value=round(dissolved_oxygen, 2),
            threshold_limit=f"< {t_do.warning} {t_do.unit}",
            unit=t_do.unit,
            severity="MEDIUM",
            description=f"DO ({dissolved_oxygen:.2f} mg/L) is hovering below optimal range ({t_do.safe} mg/L)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_MONITOR_DO",
            title="Inspect Aeration Schedule",
            description="Ensure evening aeration cycle is scheduled. Verify dissolved oxygen sensor probe clean.",
            priority="MEDIUM",
            trigger_cause="dissolved_oxygen",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # Ammonia Rules
    t_nh3 = thresholds.ammonia
    if ammonia >= t_nh3.critical:
        causes.append(RuleCause(
            rule_id="RULE_AMMONIA_CRITICAL",
            rule_name="Lethal Ammonia Concentration",
            parameter="ammonia",
            measured_value=round(ammonia, 2),
            threshold_limit=f">= {t_nh3.critical} {t_nh3.unit}",
            unit=t_nh3.unit,
            severity="CRITICAL",
            description=f"Ammonia level ({ammonia:.2f} ppm) exceeds critical toxic tolerance of {t_nh3.critical} ppm."
        ))
        if not any(a.action_id == "ACT_WATER_FLUSH_URGENT" for a in actions):
            actions.append(RecommendedAction(
                action_id="ACT_WATER_EXCHANGE_ADVICE",
                title="Water Exchange Advice: High Ammonia Flush",
                description="Immediately conduct a 30% pond water exchange and suspend feed for 24 hours.",
                priority="URGENT",
                trigger_cause="ammonia",
                device_command="RELAY_PUMP_ON",
                status="Would trigger" if is_simulation else "Suggested only"
            ))
    elif ammonia >= t_nh3.high:
        causes.append(RuleCause(
            rule_id="RULE_AMMONIA_HIGH",
            rule_name="High Ammonia Alert",
            parameter="ammonia",
            measured_value=round(ammonia, 2),
            threshold_limit=f">= {t_nh3.high} {t_nh3.unit}",
            unit=t_nh3.unit,
            severity="HIGH",
            description=f"Ammonia level ({ammonia:.2f} ppm) threatens prawn growth and immune response."
        ))
        if not any(a.action_id in ("ACT_WATER_FLUSH_URGENT", "ACT_WATER_EXCHANGE_ADVICE") for a in actions):
            actions.append(RecommendedAction(
                action_id="ACT_WATER_EXCHANGE_ADVICE",
                title="Water Exchange Advice: Siphon & Refresh",
                description="Initiate 15% bottom pond siphoning and replenish with aged freshwater. Cut feeding by 50%.",
                priority="HIGH",
                trigger_cause="ammonia",
                device_command=None,
                status="Would trigger" if is_simulation else "Suggested only"
            ))
    elif ammonia >= t_nh3.warning:
        causes.append(RuleCause(
            rule_id="RULE_AMMONIA_WARNING",
            rule_name="Elevated Ammonia Warning",
            parameter="ammonia",
            measured_value=round(ammonia, 2),
            threshold_limit=f">= {t_nh3.warning} {t_nh3.unit}",
            unit=t_nh3.unit,
            severity="MEDIUM",
            description=f"Ammonia ({ammonia:.2f} ppm) is accumulating above the optimal threshold ({t_nh3.safe} ppm)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_AMMONIA_FEED_ADJUST",
            title="Reduce Feed Ration",
            description="Check feed trays for uneaten pellets. Reduce daily feeding by 30% to prevent organic build-up.",
            priority="MEDIUM",
            trigger_cause="ammonia",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # Turbidity Rules
    t_turb = thresholds.turbidity
    if turbidity > t_turb.max_critical:
        causes.append(RuleCause(
            rule_id="RULE_TURBIDITY_CRITICAL",
            rule_name="Extreme Silt / Turbidity Overload",
            parameter="turbidity",
            measured_value=round(turbidity, 1),
            threshold_limit=f"> {t_turb.max_critical} {t_turb.unit}",
            unit=t_turb.unit,
            severity="CRITICAL",
            description=f"Turbidity ({turbidity:.1f} NTU) indicates heavy silt load or excessive phytoplankton decay."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_FILTER_WATER",
            title="Change/Filter Water",
            description="Change/filter water immediately: activate mechanical settling filters and divert muddy inflow channels.",
            priority="HIGH",
            trigger_cause="turbidity",
            device_command="RELAY_FILTER_ON",
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif turbidity > t_turb.max_warning:
        causes.append(RuleCause(
            rule_id="RULE_TURBIDITY_HIGH",
            rule_name="High Turbidity Warning",
            parameter="turbidity",
            measured_value=round(turbidity, 1),
            threshold_limit=f"> {t_turb.max_warning} {t_turb.unit}",
            unit=t_turb.unit,
            severity="MEDIUM",
            description=f"Turbidity ({turbidity:.1f} NTU) is elevated above optimal range ({t_turb.min_safe}-{t_turb.max_safe} NTU)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_FILTER_WATER",
            title="Change/Filter Water",
            description="Change/filter water: activate circulation filters to clear suspended particulate matters.",
            priority="MEDIUM",
            trigger_cause="turbidity",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif turbidity < t_turb.min_critical:
        causes.append(RuleCause(
            rule_id="RULE_TURBIDITY_LOW",
            rule_name="Abnormally Clear Water (Algae Crash)",
            parameter="turbidity",
            measured_value=round(turbidity, 1),
            threshold_limit=f"< {t_turb.min_critical} {t_turb.unit}",
            unit=t_turb.unit,
            severity="MEDIUM",
            description=f"Pond water is too clear ({turbidity:.1f} NTU). Lack of plankton bloom stresses prawns and promotes filamentous weeds."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_FERTILIZE_BLOOM",
            title="Stimulate Natural Plankton Bloom",
            description="Apply mild organic fertilizer/probiotics to restore protective water color and natural food web.",
            priority="LOW",
            trigger_cause="turbidity",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # pH Rules
    t_ph = thresholds.ph
    if ph < t_ph.min_critical or ph > t_ph.max_critical:
        causes.append(RuleCause(
            rule_id="RULE_PH_CRITICAL",
            rule_name="Critical pH Boundary Hazard",
            parameter="ph",
            measured_value=round(ph, 2),
            threshold_limit=f"< {t_ph.min_critical} or > {t_ph.max_critical} {t_ph.unit}",
            unit=t_ph.unit,
            severity="CRITICAL",
            description=f"pH ({ph:.2f}) is in the lethal prawn zone (<{t_ph.min_critical} or >{t_ph.max_critical}). Carapace molting failure imminent."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_PH_EMERGENCY_BUFFER",
            title="Immediate pH Buffer Treatment",
            description="Apply agricultural lime (CaCO3) for acidic water or fresh water dilution for extreme alkaline water.",
            priority="URGENT",
            trigger_cause="ph",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif ph < t_ph.min_warning or ph > t_ph.max_warning:
        causes.append(RuleCause(
            rule_id="RULE_PH_WARNING",
            rule_name="pH Out of Range Warning",
            parameter="ph",
            measured_value=round(ph, 2),
            threshold_limit=f"< {t_ph.min_warning} or > {t_ph.max_warning} {t_ph.unit}",
            unit=t_ph.unit,
            severity="MEDIUM",
            description=f"pH ({ph:.2f}) is out of safe range ({t_ph.min_safe} - {t_ph.max_safe})."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_PH_ADJUST",
            title="Adjust Pond Alkalinity",
            description="Measure total alkalinity. Dose agricultural limestone gradually to stabilize buffer capacity.",
            priority="MEDIUM",
            trigger_cause="ph",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # Temperature Rules
    t_temp = thresholds.temperature
    if temperature < t_temp.min_critical or temperature > t_temp.max_critical:
        causes.append(RuleCause(
            rule_id="RULE_TEMP_CRITICAL",
            rule_name="Extreme Thermal Stress",
            parameter="temperature",
            measured_value=round(temperature, 1),
            threshold_limit=f"< {t_temp.min_critical} or > {t_temp.max_critical} {t_temp.unit}",
            unit=t_temp.unit,
            severity="CRITICAL",
            description=f"Temperature ({temperature:.1f}°C) exceeds thermal tolerance bounds ({t_temp.min_critical} - {t_temp.max_critical}°C)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_THERMAL_MANAGEMENT",
            title="Deepen Pond Water Level / Shade",
            description="Increase pond depth to provide thermal refuge. Run paddlewheels at dawn to avoid destratification shock.",
            priority="HIGH",
            trigger_cause="temperature",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif temperature < t_temp.min_warning or temperature > t_temp.max_warning:
        causes.append(RuleCause(
            rule_id="RULE_TEMP_WARNING",
            rule_name="Sub-optimal Temperature Warning",
            parameter="temperature",
            measured_value=round(temperature, 1),
            threshold_limit=f"< {t_temp.min_warning} or > {t_temp.max_warning} {t_temp.unit}",
            unit=t_temp.unit,
            severity="MEDIUM",
            description=f"Temperature ({temperature:.1f}°C) is outside the optimal growth band ({t_temp.min_safe} - {t_temp.max_safe}°C)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_TEMP_FEED_MANAGEMENT",
            title="Adjust Feeding Rate for Temperature",
            description="Modulate feeding quantity: prawn digestion slows significantly outside 27-31°C.",
            priority="LOW",
            trigger_cause="temperature",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # Water Level Rules
    t_lvl = thresholds.water_level
    if water_level < t_lvl.min_critical:
        causes.append(RuleCause(
            rule_id="RULE_LEVEL_CRITICAL_LOW",
            rule_name="Critically Low Pond Water Level",
            parameter="water_level",
            measured_value=round(water_level, 2),
            threshold_limit=f"< {t_lvl.min_critical} {t_lvl.unit}",
            unit=t_lvl.unit,
            severity="CRITICAL",
            description=f"Water level ({water_level:.2f} m) is dangerously low. Prawns are vulnerable to rapid heat stress and bird predation."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_START_INFLOW_PUMP",
            title="Start Freshwater Inflow Pump",
            description="Start freshwater inlet pump immediately and inspect dykes/sluices for piping leaks.",
            priority="URGENT",
            trigger_cause="water_level",
            device_command="RELAY_PUMP_ON",
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif water_level > t_lvl.max_critical:
        causes.append(RuleCause(
            rule_id="RULE_LEVEL_OVERFLOW",
            rule_name="Pond Overflow Risk",
            parameter="water_level",
            measured_value=round(water_level, 2),
            threshold_limit=f"> {t_lvl.max_critical} {t_lvl.unit}",
            unit=t_lvl.unit,
            severity="HIGH",
            description=f"Water level ({water_level:.2f} m) threatens to overtop pond banks, risking massive prawn escape."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_OPEN_DRAIN",
            title="Open Overflow Spillway",
            description="Open screened drainage spillway to maintain safe freeboard level.",
            priority="HIGH",
            trigger_cause="water_level",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))
    elif water_level < t_lvl.min_warning:
        causes.append(RuleCause(
            rule_id="RULE_LEVEL_WARNING_LOW",
            rule_name="Low Water Level Warning",
            parameter="water_level",
            measured_value=round(water_level, 2),
            threshold_limit=f"< {t_lvl.min_warning} {t_lvl.unit}",
            unit=t_lvl.unit,
            severity="MEDIUM",
            description=f"Water level ({water_level:.2f} m) is dropping below desired depth ({t_lvl.min_safe} m)."
        ))
        actions.append(RecommendedAction(
            action_id="ACT_TOPUP_WATER",
            title="Top Up Pond Water Level",
            description="Schedule replenishment from canal or reservoir to reach 1.3 m depth.",
            priority="LOW",
            trigger_cause="water_level",
            device_command=None,
            status="Would trigger" if is_simulation else "Suggested only"
        ))

    # ----------------------------------------------------
    # 3. OVERALL RISK CALCULATION, SUGGESTIONS & SUMMARY
    # ----------------------------------------------------
    suggestions: List[str] = [f"{a.title}: {a.description}" for a in actions]

    severities = [c.severity for c in causes]
    if "CRITICAL" in severities:
        overall_risk: RiskLevel = "CRITICAL"
        critical_causes = [c for c in causes if c.severity == "CRITICAL"]
        if any(c.parameter in ("dissolved_oxygen", "compound:temp_do") for c in critical_causes):
            summary = "Oxygen is dangerously low! Turn on aerators immediately to protect prawns."
        elif any(c.parameter in ("ammonia", "compound:nh3_ph") for c in critical_causes):
            summary = "Toxic ammonia alert! Perform immediate water exchange and stop feeding."
        elif any(c.parameter == "ph" for c in critical_causes):
            summary = "Critical pH boundary hazard! Apply agricultural lime buffer immediately."
        elif any(c.parameter == "water_level" for c in critical_causes):
            summary = "Critically low pond water level! Start freshwater inlet pump immediately."
        elif any(c.parameter == "turbidity" for c in critical_causes):
            summary = "Extreme turbidity overload! Activate settling filters immediately."
        else:
            summary = "CRITICAL HAZARD: Immediate intervention required to protect prawns."
    elif "HIGH" in severities:
        overall_risk: RiskLevel = "HIGH"
        if actions:
            summary = f"Warning: {actions[0].title}. Review recommended actions below."
        else:
            summary = "Warning: Water quality is drifting out of safe range. Review recommended actions below."
    elif "MEDIUM" in severities:
        overall_risk: RiskLevel = "MEDIUM"
        if actions:
            summary = f"Advisory: {actions[0].title}. Monitor pond conditions closely."
        else:
            summary = "Advisory: Minor water quality fluctuations detected. Monitor pond conditions closely."
    else:
        overall_risk: RiskLevel = "LOW"
        summary = "SAFE: Pond conditions are safe and healthy for freshwater prawns."

    return RuleEvaluationResult(
        overall_risk=overall_risk,
        causes=causes,
        recommended_actions=actions,
        suggestions=suggestions,
        timestamp=datetime.utcnow(),
        is_simulation=is_simulation,
        summary_message=summary
    )
