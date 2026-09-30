@echo off
title PesoTrack - Clean Slate Reset
color 0E

echo.
echo ==========================================
echo         PESOTRACK CLEAN SLATE RESET
echo ==========================================
echo.
echo WARNING:
echo This will DELETE ALL users and demo/system
echo records from the LOCAL "pesotrack" database.
echo It will then create one admin and one user.
echo.
echo It will NOT change your React or backend code.
echo.

set /p confirm=Type DELETE to continue:

if /I not "%confirm%"=="DELETE" (
    echo.
    echo Reset cancelled.
    pause
    exit /b
)

echo.
echo Running reset...
echo.

cd /d "%~dp0backend"

node scripts\resetDemoData.js

echo.
if errorlevel 1 (
    echo Reset failed. Check the message above.
) else (
    echo Reset completed successfully.
    echo.
    echo Admin: admin@pesotrack.test
    echo User : user@pesotrack.test
)

echo.
pause
