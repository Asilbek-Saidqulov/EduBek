@echo off
REM EduBek — Windows Start Script (Batch)
REM Run: scripts\start-windows.bat
REM
REM Starts the EduBek production server with Socket.IO on Windows.

echo ==========================================
echo   EduBek - Windows Production Start
echo ==========================================

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found. Run scripts\setup-windows.ps1 first.
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo ERROR: node_modules not found. Run: npm install
    exit /b 1
)

REM Set production environment
set NODE_ENV=production

REM Start the server
echo.
echo Starting EduBek server (Next.js + Socket.IO)...
echo.
npx tsx src/server/index.ts

echo.
echo Server stopped.
