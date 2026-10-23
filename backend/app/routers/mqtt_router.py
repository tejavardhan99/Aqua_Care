from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.services.mqtt_service import mqtt_service

router = APIRouter(prefix="/api/mqtt", tags=["MQTT Bridge"])

class MqttConfigPayload(BaseModel):
    topic: str

@router.get("/status", response_model=Dict[str, Any])
def get_mqtt_status():
    """
    Returns real-time HiveMQ broker connection status, topic, and packets received.
    """
    return mqtt_service.get_status()

@router.post("/configure", response_model=Dict[str, Any])
def configure_mqtt(payload: MqttConfigPayload):
    """
    Updates the subscribed MQTT topic on the fly.
    """
    if not payload.topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty.")
    mqtt_service.update_topic(payload.topic)
    return mqtt_service.get_status()
