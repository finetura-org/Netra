@echo off
title NETRA Backend Service
echo ==========================================
echo   NETRA - Backend Service Starter
echo ==========================================
echo.
cd /d "%~dp0"

echo Checking Python dependencies...
python -c "import fastapi, playwright, playwright_stealth, aiosqlite, PIL, imagehash, groq, jwt, dotenv" 2>NUL
if %ERRORLEVEL% neq 0 (
    echo Python dependencies missing. Installing requirements from requirements.txt...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ERROR: Failed to install Python dependencies. Please ensure pip is installed and works.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
    echo.
)

echo Ensuring Playwright browser is ready...
python -m playwright install chromium
if %ERRORLEVEL% neq 0 (
    echo WARNING: Playwright browser check failed. Image search will use fallback mode.
)
echo.

echo Starting FastAPI server via Uvicorn...
python main.py
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start the backend service.
)
echo.
echo Backend service has stopped.
pause

