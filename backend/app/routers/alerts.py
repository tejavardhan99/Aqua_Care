from fastapi import APIRouter, HTTPException, Query, Depends, status
from typing import List, Optional, Dict, Any

from app.models.alerts import AlertItem, AlertAcknowledgeRequest
from app.models.user import User
from app.engine.deduplicator import alert_manager
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertItem])
def list_alerts(
    severity: Optional[str] = Query(None, regex="^(CRITICAL|HIGH|MEDIUM|WARNING|INFO)$"),
    unacknowledged_only: bool = Query(False),
    pond_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """
    Returns alerts scoped to the logged-in user and their ponds (server-side authorization).
    """
    effective_pond_id = pond_id
    if current_user.role != "admin":
        if pond_id and pond_id not in current_user.pond_ids:
            return []
        if not pond_id and current_user.pond_ids:
            effective_pond_id = current_user.pond_ids[0]

    return alert_manager.get_alerts(
        pond_id=effective_pond_id,
        severity=severity,
        unacknowledged_only=unacknowledged_only,
        limit=limit
    )

@router.get("/unread-count", response_model=Dict[str, int])
def get_unread_count(
    pond_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the count of unacknowledged alerts scoped to the user's ponds.
    """
    effective_pond_id = pond_id
    if current_user.role != "admin":
        if pond_id and pond_id not in current_user.pond_ids:
            return {"unread_count": 0}
        if not pond_id and current_user.pond_ids:
            effective_pond_id = current_user.pond_ids[0]

    count = alert_manager.get_unread_count(pond_id=effective_pond_id)
    return {"unread_count": count}

@router.post("/{alert_id}/ack", response_model=AlertItem)
def acknowledge_alert(
    alert_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge a specific alert item.
    """
    alert = alert_manager.acknowledge_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/ack-all", response_model=Dict[str, Any])
def acknowledge_all_alerts(
    pond_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Acknowledge all pending alerts.
    """
    count = alert_manager.acknowledge_all(pond_id=pond_id)
    return {"acknowledged_count": count, "status": "success"}

@router.get("/active-conditions", response_model=Dict[str, Any])
def get_active_conditions(pond_id: str = "pond-01"):
    """
    Returns the current continuing condition state used by the alert deduplicator.
    """
    return alert_manager.get_active_conditions(pond_id=pond_id)
