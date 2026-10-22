from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List

from app.storage.db import telemetry_store
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/device", tags=["Device Management"])

class DeviceCommandRequest(BaseModel):
    command: str  # e.g. "RELAY_AERATOR_ON", "RELAY_AERATOR_OFF", "RELAY_PUMP_ON", "RELAY_PUMP_OFF"
    target_device: str = "ESP32-POND-01"

class IntervalUpdateRequest(BaseModel):
    interval_seconds: int

@router.get("/status", response_model=Dict[str, Any])
def get_device_status():
    """
    Returns connection health: Connected / Stale (no data > 2x interval) / Disconnected / Unknown.
    """
    return telemetry_store.get_connection_status()

@router.post("/command", response_model=Dict[str, Any])
def send_device_command(
    request: DeviceCommandRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Sends command to the ESP32 actuator controller.
    """
    valid_commands = [
        "RELAY_AERATOR_ON", "RELAY_AERATOR_OFF",
        "RELAY_PUMP_ON", "RELAY_PUMP_OFF",
        "RELAY_FILTER_ON", "RELAY_FILTER_OFF",
        "REBOOT_DEVICE"
    ]
    if request.command not in valid_commands:
        raise HTTPException(status_code=400, detail=f"Invalid command. Allowed: {valid_commands}")

    cmd_record = telemetry_store.queue_device_command(
        command=request.command,
        target=request.target_device,
        issued_by=current_user.email
    )
    return {
        "status": "Sent to device",
        "command": cmd_record,
        "message": f"Command '{request.command}' successfully dispatched to {request.target_device}."
    }

@router.get("/commands", response_model=List[Dict[str, Any]])
def list_device_commands():
    return telemetry_store.get_device_commands()

@router.post("/interval", response_model=Dict[str, Any])
def set_interval(
    request: IntervalUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    telemetry_store.set_reporting_interval(request.interval_seconds)
    return {
        "status": "success",
        "interval_seconds": telemetry_store.get_reporting_interval(),
        "message": f"ESP32 reporting interval updated to {request.interval_seconds}s."
    }

@router.get("/notifications-status", response_model=Dict[str, Any])
def get_notifications_status():
    """
    Reports external notification channel statuses.
    Explicitly marks channels as Not Configured as required:
    'Email/SMS/Telegram: show as "Not configured" unless implemented. Never imply a message was sent when it wasn't.'
    """
    return {
        "email": {
            "configured": False,
            "status": "Not configured",
            "provider": None,
            "recipient": None
        },
        "sms": {
            "configured": False,
            "status": "Not configured",
            "provider": None,
            "recipient": None
        },
        "telegram": {
            "configured": False,
            "status": "Not configured",
            "bot_connected": False,
            "chat_id": None
        },
        "in_app_bell": {
            "configured": True,
            "status": "Active (Real-time in-browser)",
            "provider": "AquaCare Notification Hub"
        }
    }

