@echo off
echo =======================================================
echo Starting Hospital Management System (HMS)...
echo =======================================================

start "HMS Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul
start "HMS Frontend Client" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =======================================================
echo System is launching!
echo Backend API:  http://localhost:5000
echo Web Frontend: http://localhost:3000
echo =======================================================
pause
