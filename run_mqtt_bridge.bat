@echo off
echo Starting AquaCare Live HiveMQ MQTT Bridge...
set PYTHONPATH=backend
backend\venv\Scripts\python.exe scripts\mqtt_bridge.py
pause
