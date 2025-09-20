@echo off
title إسلام للألوميتال - نظام إدارة الطلبات
echo.
echo ============================================================
echo إسلام للألوميتال - نظام إدارة الطلبات
echo Eslam for Aluminum - Order Management System
echo ============================================================
echo.

REM Check if dist folder exists
if not exist "dist" (
    echo ❌ Application files not found!
    echo.
    echo Please make sure the 'dist' folder exists.
    echo If you're the developer, run: npm run build
    echo.
    pause
    exit /b 1
)

echo ✅ Application files found
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed!
    echo.
    echo 📥 To run this application, you need to install Python:
    echo.
    echo 1. Go to: https://www.python.org/downloads/
    echo 2. Download Python for Windows
    echo 3. During installation, check "Add Python to PATH"
    echo 4. Restart this batch file
    echo.
    pause
    exit /b 1
)

echo ✅ Python found! Starting server...
echo.
echo 🌐 Application will be available at: http://localhost:8080
echo 🌐 Press Ctrl+C to stop the server
echo.

REM Change to dist directory and start server
cd dist
python -m http.server 8080

echo.
echo Server stopped.
pause
