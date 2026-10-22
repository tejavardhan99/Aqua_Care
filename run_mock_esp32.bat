@echo off
echo Starting AquaCare ESP32 Mock Telemetry Feeder...
cd /d "%~dp0"
backend\venv\Scripts\python esp32\mock_esp32_feeder.py --interval 10 --url http://127.0.0.1:8000/api/telemetry
pause

