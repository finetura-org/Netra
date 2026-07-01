@echo off
title NETRA Prototype Launcher
echo ====================================================
echo   NETRA - Integrated Dual Starter (DB Version)
echo ====================================================
echo.
echo Launching Backend FastAPI Service...
start "NETRA Backend" cmd /c "cd /d %~dp0\backend && start_Backend.bat"
echo.
echo Launching Frontend React Client...
start "NETRA Frontend" cmd /c "cd /d %~dp0\frontend && Start_frontend.bat"
echo.
echo ====================================================
echo   Both services initiated. Check separate windows.
echo ====================================================
echo.
pause
