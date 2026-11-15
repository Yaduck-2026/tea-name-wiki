@echo off
cd /d "%~dp0"
node scripts/admin-server.mjs
if errorlevel 1 pause
