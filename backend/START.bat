@echo off
title Backend Server
cd /d %~dp0

echo.
echo ========================================
echo   BACKEND SERVER - ONE COMMAND START
echo ========================================
echo.

REM Create venv if needed
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Install dependencies
echo Installing dependencies...
.venv\Scripts\python.exe -m pip install --quiet --upgrade pip
.venv\Scripts\python.exe -m pip install --quiet flask flask-cors requests python-dotenv pytrends playwright

REM Install Playwright browsers if needed
echo Checking Playwright...
.venv\Scripts\python.exe -m playwright install chromium 2>nul
if errorlevel 1 (
    echo Installing Playwright browsers...
    .venv\Scripts\python.exe -m playwright install chromium
)

REM Start server
echo.
echo Starting server...
echo.
.venv\Scripts\python.exe unified_server.py

pause

