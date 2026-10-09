@echo off
title Laxmi Puja Local Server (Port 8080)
echo =========================================================
echo   Starting Laxmi Puja Mandap Server on Port 8080...
echo   Open: http://localhost:8080/
echo =========================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
