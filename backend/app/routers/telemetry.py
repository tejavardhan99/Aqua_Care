from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, Header, HTTPException, Depends, status
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.telemetry import TelemetryPayload, TelemetryRecord
from app.models.rules import RuleEvaluationResult
from app.engine.rule_engine import evaluate_readings
from app.engine.deduplicator import alert_manager
from app.storage.db import telemetry_store
from app.config import settings

router = APIRouter(prefix="/api/telemetry", tags=["Telemetry"])

# Active WebSocket connections
active_connections: List[WebSocket] = []

def verify_device_key(x_device_api_key: Optional[str] = Header(None, alias="X-Device-API-Key")):
    """
    ESP32 hardware edge authentication.
    Requires matching DEVICE_API_KEY in X-Device-API-Key header.
    Never exposed to client browser code.
    """
    if not x_device_api_key or x_device_api_key != settings.DEVICE_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized edge device. Valid X-Device-API-Key required."
        )
    return x_device_api_key

async def broadcast_telemetry(payload: Dict[str, Any]):
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_json(payload)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in active_connections:
            active_connections.remove(ws)

@router.post("", response_model=Dict[str, Any])
async def ingest_telemetry(
    payload: TelemetryPayload,
    device_key: str = Depends(verify_device_key)
):
    """
    ESP32 sends live sensor readings here every N seconds.
    The single source of truth rule engine evaluates the telemetry,
    and alert deduplication processes any active hazards.
    """
    # 1. Store reading
    record = telemetry_store.add_reading(payload)
    
    # 2. Evaluate using single source of truth rule engine
    evaluation = evaluate_readings(
        temperature=record.temperature,
        ph=record.ph,
        dissolved_oxygen=record.dissolved_oxygen,
        turbidity=record.turbidity,
        ammonia=record.ammonia,
        water_level=record.water_level,
        is_simulation=False
    )
    
    # 3. Process alert generation with cooldown and deduplication
    new_alerts = alert_manager.process_evaluation(
        evaluation=evaluation,
        pond_id="pond-01",
        user_id="user-default"
    )
    
    # 4. Connection status
    conn_status = telemetry_store.get_connection_status()
    
    response_data = {
        "record": record.dict(),
        "evaluation": evaluation.dict(),
        "new_alerts_count": len(new_alerts),
        "connection": conn_status
    }
    
    # Broadcast to live UI WebSocket subscribers
    await broadcast_telemetry({
        "type": "TELEMETRY_UPDATE",
        "data": response_data
    })
    
    return response_data

@router.post("/mqtt-sync", response_model=Dict[str, Any])
async def sync_mqtt_telemetry(payload: TelemetryPayload):
    """
    Ingests live MQTT packets received from HiveMQ public broker.
    Evaluates with single source of truth rule engine and alert deduplicator.
    """
    record = telemetry_store.add_reading(payload)
    evaluation = evaluate_readings(
        temperature=record.temperature,
        ph=record.ph,
        dissolved_oxygen=record.dissolved_oxygen,
        turbidity=record.turbidity,
        ammonia=record.ammonia,
        water_level=record.water_level,
        is_simulation=False
    )
    new_alerts = alert_manager.process_evaluation(
        evaluation=evaluation,
        pond_id="pond-01",
        user_id="user-default"
    )
    conn_status = telemetry_store.get_connection_status()
    return {
        "record": record.dict(),
        "evaluation": evaluation.dict(),
        "new_alerts_count": len(new_alerts),
        "connection": conn_status
    }

@router.get("/latest")
def get_latest():
    """
    Returns latest real ESP32 telemetry reading, connection status, and rule evaluation.
    """
    record = telemetry_store.get_latest_reading()
    conn_status = telemetry_store.get_connection_status()

    if not record:
        return {
            "record": None,
            "evaluation": None,
            "connection": conn_status,
            "device_flags": None
        }

    evaluation = evaluate_readings(
        temperature=record.temperature,
        ph=record.ph,
        dissolved_oxygen=record.dissolved_oxygen,
        turbidity=record.turbidity,
        ammonia=record.ammonia,
        water_level=record.water_level,
        is_simulation=False
    )

    return {
        "record": record.dict(),
        "evaluation": evaluation.dict(),
        "connection": conn_status,
        "device_flags": record.device_flags.dict() if record.device_flags else None
    }

@router.get("/history", response_model=List[TelemetryRecord])
def get_history(range: str = Query("24h", regex="^(1h|6h|24h|all)$")):
    """
    Returns historical telemetry records for trends and line charts.
    """
    return telemetry_store.get_history(range_filter=range)

@router.websocket("/ws")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        # Send initial latest reading on connect
        latest = get_latest()
        await websocket.send_json({"type": "INIT_STATE", "data": latest})
        while True:
            # Keep socket alive and receive client pings/messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        if websocket in active_connections:
            active_connections.remove(websocket)
    except Exception:
        if websocket in active_connections:
            active_connections.remove(websocket)

