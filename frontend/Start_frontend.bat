@echo off
title NETRA Frontend Client
echo ==========================================
echo   NETRA - Frontend Client Starter
echo ==========================================
echo.
cd /d "%~dp0"

if not exist node_modules (
    echo node_modules not found. Installing npm dependencies...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo ERROR: Failed to install npm dependencies. Please ensure Node.js and npm are installed.
        pause
        exit /b 1
    )
    echo Dependencies installed successfully.
    echo.
)

echo Starting Vite development server...
npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Failed to start the frontend server.
    pause
)
