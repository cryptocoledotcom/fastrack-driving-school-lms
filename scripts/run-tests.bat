@echo off
cd /d "%~dp0"
cd ../functions && npm test
pause
