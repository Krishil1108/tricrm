@echo off
echo Setting up Python environment for Advanced Chart Generation...
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not found in PATH
    echo Please install Python 3.7 or higher from https://python.org
    pause
    exit /b 1
)

echo Python found. Installing required packages...
::

:: Change to the scripts directory
cd /d "%~dp0"

:: Upgrade pip first
echo Upgrading pip...
python -m pip install --upgrade pip

:: Install from requirements file for better dependency management
echo Installing Python packages from requirements.txt...
python -m pip install -r requirements.txt

:: Verify installations
echo.
echo Verifying installations...
python -c "import matplotlib, pandas, seaborn, numpy, PIL, scipy; print('✅ All packages installed successfully')"

echo.
echo Python setup complete!
echo.

:: Test the installation
echo Testing chart generator...
echo {"operation": "chart", "labels": ["Test"], "values": [100], "chartType": "bar", "title": "Test Chart"} | python chart_generator.py

if errorlevel 0 (
    echo.
    echo ✅ SUCCESS: Python chart generator is working!
) else (
    echo.
    echo ❌ ERROR: Python chart generator test failed
)

echo.
pause