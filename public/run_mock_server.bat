@echo off
REM Mock the application run
echo Mock server is running. Press Ctrl+C to stop.
:loop
timeout /t 5 >nul
goto loop
