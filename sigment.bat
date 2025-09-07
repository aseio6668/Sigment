@echo off
REM Sigment Language Constructor - Main Entry Point
REM Usage: sigment.bat [command] [options]

cd /d "%~dp0"

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --silent
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo Please run install.bat first
        pause
        exit /b 1
    )
    echo Dependencies installed.
)

REM Run the CLI with all arguments
if "%1"=="" (
    node src\cli.js interactive
) else (
    node src\cli.js %*
)

if %errorlevel% neq 0 (
    echo.
    echo Command failed with error code %errorlevel%
    pause
)