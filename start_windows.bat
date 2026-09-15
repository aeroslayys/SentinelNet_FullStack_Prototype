@echo off
cd /d %~dp0
echo Installing SentinelNet dependencies...
call npm run install:all
if errorlevel 1 pause & exit /b 1
echo Starting SentinelNet...
call npm run dev
pause
