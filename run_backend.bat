@echo off
title Nemotron AI - Backend Server
cd /d "%~dp0backend"
echo [Nemotron] Starting Backend FastAPI on http://localhost:8000 ...
python main.py
pause
