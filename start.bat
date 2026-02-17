@echo off
echo ==========================================
echo       🚀 Starting GenFin Studio 🚀
echo ==========================================
echo.

echo [1/3] Installing Backend Dependencies...
pip install -r backend/requirements.txt
if %errorlevel% neq 0 (
    echo WARNING: Failed to install python dependencies. Please ensure Python is installed and in PATH.
    pause
    exit /b
)

echo [2/3] Starting Backend Server (Port 8000)...
start "GenFin Backend" cmd /k "cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [3/3] Starting Frontend (Port 3000)...
echo Opening browser to http://localhost:3000 ...
start http://localhost:3000

echo Starting Next.js Development Server...
call npm install
npm run dev
pause
