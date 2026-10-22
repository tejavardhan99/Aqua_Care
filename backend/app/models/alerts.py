from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

AlertSeverity = Literal["CRITICAL", "HIGH", "MEDIUM", "WARNING", "INFO"]

class AlertItem(BaseModel):
    id: str
    severity: AlertSeverity
    parameter: str
    observed_value: float
    unit: str
    rule_name: str
    rule_id: str
    explanation: str
    recommended_action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    acknowledged: bool = False
    acknowledged_at: Optional[datetime] = None
    pond_id: str = "pond-01"
    user_id: str = "user-default"
    is_simulation: bool = False

class AlertAcknowledgeRequest(BaseModel):
    acknowledged: bool = True
