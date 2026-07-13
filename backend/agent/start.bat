@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install it from https://nodejs.org and re-run this file.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies, this only happens once...
  call npm install
  if errorlevel 1 (
    echo npm install failed - see the error above.
    pause
    exit /b 1
  )
)

node agent.js
pause
