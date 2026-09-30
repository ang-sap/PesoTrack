@echo off
title PesoTrack
echo Starting PesoTrack...
echo.

start "PesoTrack Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "PesoTrack Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo PesoTrack frontend and backend are starting...
echo.
pause