from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List

from app.models.rules import SimulationEvaluationRequest, RuleEvaluationResult
from app.models.alerts import AlertItem
from app.models.user import User
from app.engine.rule_engine import evaluate_readings
from app.engine.thresholds import get_current_thresholds, update_current_thresholds, PrawnPondThresholds
from app.engine.deduplicator import alert_manager
from app.routers.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/rules", tags=["Rule Engine"])

@router.post("/evaluate", response_model=Dict[str, Any])
def evaluate_simulation(
    request: SimulationEvaluationRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates simulated sensor readings against the single-source-of-truth backend rule engine.
    Disabled by default in production end-user environments (ENABLE_SIMULATION=False).
    When enabled, restricted to authenticated administrators for diagnostic testing only.
    """
    if not settings.ENABLE_SIMULATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Simulation mode is disabled in this environment. AquaCare is running in Live Data Only mode."
        )

    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can execute diagnostic simulation evaluations."
        )

    evaluation = evaluate_readings(
        temperature=request.temperature,
        ph=request.ph,
        dissolved_oxygen=request.dissolved_oxygen,
        turbidity=request.turbidity,
        ammonia=request.ammonia,
        water_level=request.water_level,
        is_simulation=True
    )

    # Generate simulation alerts (in-memory only, no persistence)
    sim_alerts = alert_manager.process_evaluation(
        evaluation=evaluation,
        pond_id="pond-sim",
        user_id="simulator"
    )

    return {
        "evaluation": evaluation.dict(),
        "simulated_alerts": [a.dict() for a in sim_alerts],
        "is_simulation": True
    }

@router.get("/thresholds", response_model=PrawnPondThresholds)
def get_thresholds():
    """
    Returns the single-source-of-truth thresholds for freshwater prawn aquaculture.
    """
    return get_current_thresholds()

@router.put("/thresholds", response_model=PrawnPondThresholds)
def update_thresholds(
    new_thresholds: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Admin-only endpoint to update active prawn pond threshold configurations.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Threshold modification requires Pond Administrator privileges."
        )
    
    try:
        updated = update_current_thresholds(new_thresholds)
        return updated
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid threshold configuration data: {str(e)}"
        )

