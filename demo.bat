@echo off
REM Run the comprehensive demo

cd /d "%~dp0"

echo.
echo ========================================
echo  Sigment Language Constructor - Demo
echo ========================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo Running comprehensive demo...
echo.

node examples\demo.js

echo.
echo Demo complete!
pause