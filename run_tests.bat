@echo off
echo Running AquaCare Backend Pytest Suite...
cd /d "%~dp0backend"
venv\Scripts\python -m pytest tests -v
pause

