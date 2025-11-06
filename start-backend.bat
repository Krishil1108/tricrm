@echo off
echo Starting CRM Backend Server...
echo.

cd /d "C:\Users\krishils\Desktop\final\CRM\backend"

echo Installing dependencies if needed...
call npm install

echo.
echo Starting MongoDB (if installed as service)...
net start MongoDB 2>nul
if errorlevel 1 (
    echo MongoDB service not found or already running
)

echo.
echo Starting the backend server...
echo Server will be available at http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

call npm start

pause