from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import uuid

from app.models.alerts import AlertItem, AlertSeverity
from app.models.rules import RuleCause, RuleEvaluationResult
from app.config import settings

class ActiveCondition:
    def __init__(self, rule_id: str, severity: AlertSeverity, last_alert_time: datetime, alert_id: str):
        self.rule_id = rule_id
        self.severity = severity
        self.last_alert_time = last_alert_time
        self.alert_id = alert_id

class AlertDeduplicator:
    """
    Manages alert generation, deduplication, and cooldowns.
    Rule:
    - 1 alert per continuing condition.
    - Re-alert only after COOLDOWN_SECONDS (default 600s / 10 mins) if condition persists.
    - Re-alert IMMEDIATELY if severity changes (e.g. WARNING -> CRITICAL).
    - Clears active condition when reading returns to safe/resolved.
    - Never stores simulation alerts in the real registry.
    """
    def __init__(self, cooldown_seconds: int = 600):
        self.cooldown_seconds = cooldown_seconds
        # Mapping: (pond_id, rule_id) -> ActiveCondition
        self._active_conditions: Dict[Tuple[str, str], ActiveCondition] = {}
        # Storage for all generated real alerts
        self._alert_history: List[AlertItem] = []

    def process_evaluation(
        self,
        evaluation: RuleEvaluationResult,
        pond_id: str = "pond-01",
        user_id: str = "user-default"
    ) -> List[AlertItem]:
        """
        Processes evaluation causes. Returns newly created real alerts.
        If is_simulation is True, returns simulated alerts without mutating state.
        """
        now = datetime.utcnow()
        new_alerts: List[AlertItem] = []

        # If simulation, generate simulation-tagged alerts directly and return without persisting
        if evaluation.is_simulation:
            for cause in evaluation.causes:
                sim_alert = AlertItem(
                    id=f"sim-{uuid.uuid4().hex[:8]}",
                    severity=cause.severity,
                    parameter=cause.parameter,
                    observed_value=cause.measured_value,
                    unit=cause.unit,
                    rule_name=cause.rule_name,
                    rule_id=cause.rule_id,
                    explanation=cause.description,
                    recommended_action=self._find_matching_action(cause, evaluation),
                    timestamp=now,
                    acknowledged=False,
                    pond_id=pond_id,
                    user_id=user_id,
                    is_simulation=True
                )
                new_alerts.append(sim_alert)
            return new_alerts

        # Live Mode Processing
        current_active_rule_ids = set()

        for cause in evaluation.causes:
            rule_id = cause.rule_id
            current_active_rule_ids.add(rule_id)
            key = (pond_id, rule_id)
            
            should_emit = False
            condition = self._active_conditions.get(key)

            if condition is None:
                # First time this condition has fired
                should_emit = True
            elif condition.severity != cause.severity:
                # Condition severity changed (e.g., escalated to CRITICAL)
                should_emit = True
            elif (now - condition.last_alert_time).total_seconds() >= self.cooldown_seconds:
                # Cooldown period expired, re-alerting continuing issue
                should_emit = True

            if should_emit:
                alert = AlertItem(
                    id=f"alt-{uuid.uuid4().hex[:10]}",
                    severity=cause.severity,
                    parameter=cause.parameter,
                    observed_value=cause.measured_value,
                    unit=cause.unit,
                    rule_name=cause.rule_name,
                    rule_id=cause.rule_id,
                    explanation=cause.description,
                    recommended_action=self._find_matching_action(cause, evaluation),
                    timestamp=now,
                    acknowledged=False,
                    pond_id=pond_id,
                    user_id=user_id,
                    is_simulation=False
                )
                new_alerts.append(alert)
                self._alert_history.insert(0, alert)  # newest first
                self._active_conditions[key] = ActiveCondition(
                    rule_id=rule_id,
                    severity=cause.severity,
                    last_alert_time=now,
                    alert_id=alert.id
                )

        # Clear resolved conditions that are no longer triggering
        keys_to_clear = [
            k for k in self._active_conditions.keys()
            if k[0] == pond_id and k[1] not in current_active_rule_ids
        ]
        for k in keys_to_clear:
            del self._active_conditions[k]

        return new_alerts

    def _find_matching_action(self, cause: RuleCause, evaluation: RuleEvaluationResult) -> str:
        for action in evaluation.recommended_actions:
            if action.trigger_cause == cause.parameter:
                return f"{action.title}: {action.description}"
        return "Inspect sensor telemetry and inspect prawn pond visually."

    def get_alerts(
        self,
        pond_id: Optional[str] = None,
        severity: Optional[str] = None,
        unacknowledged_only: bool = False,
        limit: int = 50
    ) -> List[AlertItem]:
        filtered = self._alert_history
        if pond_id:
            filtered = [a for a in filtered if a.pond_id == pond_id]
        if severity:
            filtered = [a for a in filtered if a.severity == severity]
        if unacknowledged_only:
            filtered = [a for a in filtered if not a.acknowledged]
        return filtered[:limit]

    def get_unread_count(self, pond_id: Optional[str] = None) -> int:
        return sum(1 for a in self._alert_history if not a.acknowledged and (pond_id is None or a.pond_id == pond_id))

    def acknowledge_alert(self, alert_id: str) -> Optional[AlertItem]:
        for alert in self._alert_history:
            if alert.id == alert_id:
                alert.acknowledged = True
                alert.acknowledged_at = datetime.utcnow()
                return alert
        return None

    def acknowledge_all(self, pond_id: Optional[str] = None) -> int:
        count = 0
        now = datetime.utcnow()
        for alert in self._alert_history:
            if not alert.acknowledged and (pond_id is None or alert.pond_id == pond_id):
                alert.acknowledged = True
                alert.acknowledged_at = now
                count += 1
        return count

    def get_active_conditions(self, pond_id: str = "pond-01") -> Dict[str, Dict]:
        res = {}
        for (p, r_id), cond in self._active_conditions.items():
            if p == pond_id:
                res[r_id] = {
                    "severity": cond.severity,
                    "last_alert_time": cond.last_alert_time.isoformat(),
                    "alert_id": cond.alert_id
                }
        return res

# Global instance for app lifecycle
alert_manager = AlertDeduplicator(cooldown_seconds=settings.ALERT_COOLDOWN_SECONDS)

