@echo off
REM Clean build artifacts and generated files

cd /d "%~dp0"

echo.
echo ========================================
echo  Cleaning Sigment Language Constructor
echo ========================================
echo.

echo Cleaning generated dictionaries...
if exist "dictionaries" (
    rmdir /s /q "dictionaries"
    mkdir "dictionaries"
    echo - Dictionaries cleaned
) else (
    mkdir "dictionaries"
    echo - Dictionaries directory created
)

echo Cleaning node_modules...
if exist "node_modules" (
    rmdir /s /q "node_modules"
    echo - Node modules removed
)

echo Cleaning npm cache...
if exist "package-lock.json" (
    del "package-lock.json"
    echo - Package lock removed
)

echo.
echo Clean complete! Run 'install.bat' to reinstall dependencies.
pause