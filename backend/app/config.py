import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AquaCare — Smart Aquaculture Monitoring"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = os.getenv("AQUACARE_SECRET_KEY", "aquacare-prawn-monitoring-super-secret-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # ESP32 Communication & Health Check
    ESP32_REPORT_INTERVAL_SECONDS: int = int(os.getenv("ESP32_INTERVAL", "5"))
    STALE_THRESHOLD_MULTIPLIER: float = 2.0  # > 2 * interval = STALE (>10s)
    DISCONNECTED_THRESHOLD_SECONDS: float = 30.0  # > 30s = DISCONNECTED
    
    # Alert Deduplication / Cooldown
    ALERT_COOLDOWN_SECONDS: int = int(os.getenv("ALERT_COOLDOWN_SECONDS", "600"))  # 10 minutes
    
    # Security & Hardware Authentication
    DEVICE_API_KEY: str = os.getenv("DEVICE_API_KEY", "aquacare-device-key-2026")
    
    # Feature Flags: End-user production disables simulation by default
    ENABLE_SIMULATION: bool = os.getenv("ENABLE_SIMULATION", "false").lower() == "true"

    # MQTT HiveMQ Integration
    MQTT_ENABLED: bool = os.getenv("MQTT_ENABLED", "true").lower() == "true"
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "broker.hivemq.com")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TOPIC: str = os.getenv("MQTT_TOPIC", "prawnagent/pond01/state")

settings = Settings()
