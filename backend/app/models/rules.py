from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime

RiskLevel = Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
ActionPriority = Literal["URGENT", "HIGH", "MEDIUM", "LOW"]
ActionStatus = Literal["Suggested only", "Sent to device", "Would trigger", "Failed"]

class RuleCause(BaseModel):
    rule_id: str
    rule_name: str
    parameter: str  # e.g. "temperature", "dissolved_oxygen", "compound:temp_do"
    measured_value: float
    threshold_limit: str  # e.g. "< 3.0 mg/L", "> 1.0 ppm"
    unit: str
    severity: RiskLevel
    description: str

class RecommendedAction(BaseModel):
    action_id: str
    title: str
    description: str
    priority: ActionPriority
    trigger_cause: str  # which parameter/rule triggered it
    device_command: Optional[str] = None  # e.g. "SET_AERATOR_ON"
    status: ActionStatus = "Suggested only"

class RuleEvaluationResult(BaseModel):
    overall_risk: RiskLevel
    causes: List[RuleCause] = Field(default_factory=list)
    recommended_actions: List[RecommendedAction] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_simulation: bool = False
    summary_message: str
    suggestions: List[str] = Field(default_factory=list)

class SimulationEvaluationRequest(BaseModel):
    temperature: float = Field(..., ge=0.0, le=50.0)
    ph: float = Field(..., ge=0.0, le=14.0)
    dissolved_oxygen: float = Field(..., ge=0.0, le=25.0)
    turbidity: float = Field(..., ge=0.0, le=1000.0)
    ammonia: float = Field(..., ge=0.0, le=20.0)
    water_level: float = Field(..., ge=0.0, le=10.0)

