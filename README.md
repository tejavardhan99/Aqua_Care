# AquaCare — Smart Aquaculture Monitoring for Freshwater Prawn Ponds

> Full-stack IoT monitoring platform for freshwater prawn ponds (*Macrobrachium rosenbergii*). Ingests live telemetry from ESP32 edge nodes, runs a centralized backend rule engine to detect hazards and recommend interventions, enforces alert deduplication with a 10-minute cooldown, and provides a zero-hardware Simulation Lab for operators to test emergency scenarios safely.

---

## 1. System Setup & Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS, Lucide React, Recharts, Sonner.
- **Backend**: FastAPI (Python 3.11), Pydantic v2, Uvicorn, Jose JWT, Pytest, WebSockets.
- **Edge Microcontroller**: ESP32 C++ Arduino firmware (`esp32/firmware_sample.ino`) with HTTP POST JSON & analog probe calibration.
- **Edge Simulator**: Python CLI feeder (`esp32/mock_esp32_feeder.py`) for automated live testing.

---

## 2. Project Folder Structure

```
d:\Final_Aqua_Care\
├── backend\
│   ├── app\
│   │   ├── engine\
│   │   │   ├── rule_engine.py       # Single source of truth evaluation (Compound & Single rules)
│   │   │   ├── thresholds.py        # Centralized prawn pond threshold configuration
│   │   │   └── deduplicator.py      # Alert deduplication, 10m cooldown & severity tracking
│   │   ├── models\
│   │   │   ├── alerts.py            # Pydantic models for real & simulated alerts
│   │   │   ├── rules.py             # Rule evaluation results, causes, recommended actions
│   │   │   ├── telemetry.py         # Telemetry payloads, device flags & probe status
│   │   │   └── user.py              # User authentication & role models
│   │   ├── routers\
│   │   │   ├── alerts.py            # /api/alerts (list, unread count, acknowledge)
│   │   │   ├── auth.py              # /api/auth (login, me)
│   │   │   ├── device.py            # /api/device (status, command dispatch, intervals)
│   │   │   ├── rules.py             # /api/rules (evaluate simulation, get/put thresholds)
│   │   │   └── telemetry.py         # /api/telemetry (ingest, latest, history, websocket)
│   │   ├── storage\
│   │   │   └── db.py                # Telemetry buffer, staleness detector & command queue
│   │   ├── config.py                # App settings, timeouts & secrets
│   │   └── main.py                  # FastAPI app entry point & CORS configuration
│   ├── tests\
│   │   ├── test_rule_engine.py      # Rule engine tests (safe, hypoxia, ammonia, compound rules)
│   │   ├── test_simulation_isolation.py # Guarantees simulation never mutates live store or DB
│   │   └── test_alert_deduplication.py  # 10m cooldown, severity escalation bypass & recovery
│   └── requirements.txt
├── frontend\
│   ├── src\
│   │   ├── components\
│   │   │   ├── CausesPanel.tsx      # Triggered rule causes & measured limits
│   │   │   ├── DeviceStatusPanel.tsx# Direct ESP32 flags (relays, RSSI, voltage, probes)
│   │   │   ├── Navbar.tsx           # Live/Sim toggle, connection pill, bell badge, profile
│   │   │   ├── RecommendedActionsPanel.tsx # Action cards (priority, "Would trigger" in sim)
│   │   │   ├── SensorCard.tsx       # 6 parameter cards (value, unit, status, gauge, freshness)
│   │   │   ├── Sidebar.tsx          # Collapsible navigation drawer + hardware footer
│   │   │   ├── SimulationBanner.tsx # Persistent simulation mode notification banner
│   │   │   └── StatusPill.tsx       # Status badges pairing color with text & Lucide icons
│   │   ├── context\
│   │   │   └── AppContext.tsx       # App state, polling loop, toast triggers, simulation
│   │   ├── pages\
│   │   │   ├── AlertsPage.tsx       # Alerts center, filtering, acknowledge actions
│   │   │   ├── DashboardPage.tsx    # Live/Sim overview, 6 sensor cards, interventions
│   │   │   ├── LoginPage.tsx        # Responsive login with 1-click Admin & Operator access
│   │   │   ├── SettingsPage.tsx     # Thresholds editor (Admin), interval & notifications
│   │   │   ├── SimulationLabPage.tsx# Sliders, numeric inputs, presets & instant evaluation
│   │   │   └── TrendsPage.tsx       # Recharts 24h diurnal lines with safe threshold bands
│   │   ├── services\
│   │   │   └── api.ts               # Typed API client with token management & error handling
│   │   ├── types\
│   │   │   └── index.ts             # TypeScript domain definitions
│   │   ├── App.tsx                  # Main router shell & toaster provider
│   │   └── main.tsx                 # React DOM mount point
│   ├── package.json
│   ├── tailwind.config.js           # Deep ocean teal & seafoam design palette
│   └── vite.config.ts               # Reverse proxy for /api and /ws
├── esp32\
│   ├── firmware_sample.ino          # Production C++ Arduino sketch for ESP32
│   └── mock_esp32_feeder.py         # Python telemetry feeder for live simulation
├── run_backend.bat
├── run_frontend.bat
├── run_mock_esp32.bat
└── run_tests.bat
```

---

## 3. Endpoints Documentation

### Existing Prior Endpoints:
- None. (Workspace was initialized clean; all endpoints are documented below).

### Endpoints Created & Implemented:

| Method | Endpoint | Description | Role / Auth |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user, issue JWT bearer token | Public |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Operator / Admin |
| `POST` | `/api/telemetry` | ESP32 ingests live telemetry reading every N seconds | Hardware / Public |
| `GET` | `/api/telemetry/latest` | Fetch latest live reading, connection status & device flags | Public / Session |
| `GET` | `/api/telemetry/history` | Historical records with range filter (`1h`, `6h`, `24h`, `all`) | Session |
| `WS` | `/api/telemetry/ws` | Real-time WebSocket stream for push updates | Public / Session |
| `POST` | `/api/rules/evaluate` | **Single source of truth evaluation**: sandbox testing without mutating live store | Public / Session |
| `GET` | `/api/rules/thresholds` | Retrieve active prawn pond threshold configuration | Session |
| `PUT` | `/api/rules/thresholds` | Admin updates active biological threshold values | **Admin Only** |
| `GET` | `/api/alerts` | Query live alerts with severity & unacknowledged filters | Session |
| `GET` | `/api/alerts/unread-count`| Get unread count for navbar notification bell badge | Session |
| `POST` | `/api/alerts/{id}/ack` | Mark specific alert as acknowledged | Session |
| `POST` | `/api/alerts/ack-all` | Bulk acknowledge all pending alerts | Session |
| `GET` | `/api/alerts/active-conditions` | Inspection of continuing deduplication condition states | Session |
| `GET` | `/api/device/status` | Connection health (`CONNECTED`, `STALE`, `DISCONNECTED`, `UNKNOWN`) | Session |
| `POST` | `/api/device/command` | Dispatch command to ESP32 relays (e.g. `RELAY_AERATOR_ON`) | Session |
| `POST` | `/api/device/interval` | Adjust edge reporting rate (5s - 60s) | Session |
| `GET` | `/api/device/notifications-status` | Status of Email/SMS/Telegram gateways ("Not configured") | Session |

---

## 4. Environment Variables

### Backend (`backend/.env` or system environment):
- `AQUACARE_SECRET_KEY`: JWT secret signing key (Default: `"aquacare-prawn-monitoring-super-secret-key-2026"`).
- `ESP32_INTERVAL`: Expected edge device report interval in seconds (Default: `10`).
- `ALERT_COOLDOWN_SECONDS`: Alert deduplication cooldown period (Default: `600` / 10 minutes).

### Frontend (`frontend/.env`):
- `VITE_API_BASE`: Backend API base URL (Default: `""` -> proxied automatically by Vite to `http://127.0.0.1:8000`).

---

## 5. Quick Run Commands

### 1. Launch Backend:
```bash
# Windows
run_backend.bat
# Or manually:
cd backend
venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: `http://127.0.0.1:8000/docs`

### 2. Launch Frontend:
```bash
# Windows
run_frontend.bat
# Or manually:
cd frontend
npm run dev
```
Web Dashboard available at: `http://localhost:5173`

### 3. Run Backend Pytest Suite:
```bash
# Windows
run_tests.bat
# Or manually:
cd backend
venv\Scripts\python -m pytest tests -v
```

### 4. Stream Live ESP32 Telemetry (Mock Hardware):
```bash
# Windows
run_mock_esp32.bat
# Or manually:
backend\venv\Scripts\python esp32\mock_esp32_feeder.py --interval 10 --url http://127.0.0.1:8000/api/telemetry
```

---

## 6. Pre-Seeded User Accounts

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Pond Administrator** | `admin@aquacare.io` | `admin` (or `AquaAdmin2026!`) | Full access: edit biological thresholds, control relays, acknowledge alerts. |
| **Field Operator** | `operator@aquacare.io` | `prawn` (or `PrawnCare2026!`) | Monitoring, acknowledge alerts, run simulation lab, read-only thresholds. |

*Quick login buttons are provided on the Login screen and in the top-right profile dropdown for seamless 1-click role switching.*

---

## 7. Freshwater Prawn (*Macrobrachium rosenbergii*) Biological Rules & Thresholds

| Parameter | Unit | Safe / Optimal | Warning | High Risk | Critical Emergency | Action Plan |
|---|---|---|---|---|---|---|
| **Temperature** | °C | 27.0 - 31.0 | 25.0 - 27.0 / 31.0 - 33.0 | 22.0 - 25.0 / 33.0 - 35.0 | &lt; 22.0 / &gt; 35.0 | Deepen pond level to buffer temperature fluctuation. |
| **Dissolved Oxygen** | mg/L | &gt; 5.0 | 4.5 - 5.0 | 3.5 - 4.5 | &lt; 2.8 | **Turn ON aerators immediately**. Cease feeding. |
| **pH** | pH | 7.2 - 8.4 | 6.8 - 7.2 / 8.4 - 8.8 | 6.2 - 6.8 / 8.8 - 9.2 | &lt; 6.2 / &gt; 9.2 | Dose agricultural limestone ($CaCO_3$) buffer gradually. |
| **Ammonia (TAN)** | ppm | &le; 0.1 | 0.1 - 0.4 | 0.4 - 0.8 | &gt; 1.2 | Immediate 25-30% water exchange advice; cut feed by 50%. |
| **Turbidity** | NTU | 25.0 - 50.0 | 18.0 - 25.0 / 50.0 - 65.0 | 12.0 - 18.0 / 65.0 - 80.0 | &lt; 12.0 / &gt; 80.0 | **Change/filter water**: activate mechanical screen/sediment filter. |
| **Water Level** | m | 1.1 - 1.6 | 0.9 - 1.1 / 1.6 - 1.8 | 0.7 - 0.9 / 1.8 - 2.1 | &lt; 0.7 / &gt; 2.1 | Start freshwater inflow pump; inspect dyke for leaks. |

### Compound Rules:
1. **Hypoxia Hazard under Heat** (`temp > 31.0°C` AND `DO < 4.0 mg/L`):
   - Result: **CRITICAL**.
   - Action: "Turn ON primary & emergency aerators immediately; halt feeding."
2. **Toxic Ammonia Ionization** (`ammonia > 0.5 ppm` AND `pH > 8.2`):
   - Result: **CRITICAL**.
   - Explanation: High pH converts harmless ammonium ($NH_4^+$) into lethal un-ionized ammonia ($NH_3$) gas.
   - Action: "Emergency 25% pond water exchange & intense aeration."

---

## 8. Simulation Sandbox Guarantees
- **Threshold Parity**: Uses the exact same backend engine (`evaluate_readings()`) as live telemetry.
- **Hardware Isolation**: Actuator commands return `"Would trigger"` only; physical relay commands are suppressed.
- **Database Isolation**: Simulated telemetry values never enter `telemetry_store` or affect live history.
- **Alert Log Isolation**: Simulation alerts are tagged `is_simulation = true` and are displayed only in the simulation lab preview. They are never committed to the user's permanent alert registry.

---

## 9. 21st.dev Component Styles Used
- **Stat Widget Cards**: Designed with subtle borders, glowing status indicator pills, unit labels, and visual range progress bars.
- **Persistent Warning Banner**: High-visibility amber-to-orange gradient banner indicating simulation mode and hardware isolation.
- **Device Diagnostic Matrix**: Hardware probe health badge matrix with real-time RSSI signal quality badges and relay coil status.
- **Responsive Navigation Drawer**: Collapsible desktop sidebar transitioning into an accessible mobile sliding drawer.
- **Interactive Control Sliders**: Polished dual slider + numeric input controls with bounded validation.

---

## 10. Unfinished Items & Hardware Dependencies
- **Physical Relay Control**: The backend queues and logs device commands (`RELAY_AERATOR_ON`, `RELAY_PUMP_ON`). In production hardware deployment, the ESP32 firmware connects to this endpoint or receives commands via MQTT/WebSocket to trigger physical GPIO optocoupler relays.
- **External SMS & Email Gateways**: As required by system engineering rules, Email, SMS, and Telegram notification channels are explicitly marked as **"Not configured"** in the UI and settings panel to ensure users are never misled into believing external messages were dispatched. Adding Twilio and SendGrid credentials in `backend/app/config.py` will activate external delivery.

