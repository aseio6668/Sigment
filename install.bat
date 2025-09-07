@echo off
REM Install dependencies and setup

cd /d "%~dp0"

echo.
echo ========================================
echo  Installing Sigment Language Constructor
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    echo Minimum version required: Node.js 16+
    pause
    exit /b 1
) else (
    echo ✓ Node.js found:
    node --version
    echo.
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed
    pause
    exit /b 1
) else (
    echo ✓ npm found:
    npm --version
    echo.
)

echo Installing dependencies...
npm install --progress=true

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running: npm install --verbose
    pause
    exit /b 1
) else (
    echo ✅ Dependencies installed successfully!
)

echo.
echo Creating directories...
if not exist "dictionaries" mkdir "dictionaries"
if not exist "data" mkdir "data"
if not exist "examples" mkdir "examples"

echo.
echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Quick start:
echo   run.bat          - Interactive mode
echo   demo.bat         - Run demo
echo   sigment.bat      - Command line usage
echo.
echo Examples:
echo   sigment.bat generate --name MyLang --style default
echo   sigment.bat translate --language TestLang --word hello
echo   sigment.bat list
echo.
pause