from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.routers import auth, telemetry, rules, alerts, device

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AquaCare — Smart Aquaculture Telemetry & Rule Engine for Freshwater Prawn Ponds"
)

# Enable CORS for Vite frontend development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(telemetry.router)
app.include_router(rules.router)
app.include_router(alerts.router)
app.include_router(device.router)

@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy",
        "docs_url": "/docs",
        "system_time": datetime.utcnow().isoformat()
    }

@app.get("/api/health")
def health():
    return {
        "status": "up",
        "timestamp": datetime.utcnow().isoformat()
    }

