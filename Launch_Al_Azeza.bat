@echo off
:: Enable UTF-8 for smooth icon rendering
chcp 65001 > nul
title Al-Azeza Platform Launcher

echo ========================================
echo       🤝 Al-Azeza - Community Response
echo ========================================
echo.

:: Define correct project and XAMPP folder paths
set "PROJECT_PATH=C:\xampp\htdocs\azeza"
set "XAMPP_PATH=C:\xampp"

echo 1. Checking MySQL database status (XAMPP)...

:: Check if MySQL process is running
tasklist /fi "imagename eq mysqld.exe" 2>nul | find /i "mysqld.exe" >nul
if %errorlevel% equ 0 (
    echo      [✅] MySQL database is already running.
) else (
    echo      [⚠️] MySQL is stopped. Attempting to auto-start...
    
    :: Try to launch MySQL via XAMPP script paths
    if exist "%XAMPP_PATH%\mysql_start.bat" (
        echo      [🔄] Launching MySQL via XAMPP service...
        call "%XAMPP_PATH%\mysql_start.bat" >nul 2>&1
        timeout /t 3 /nobreak > nul
    ) else if exist "%XAMPP_PATH%\xampp_start.exe" (
        echo      [🔄] Launching database engine...
        start "" "%XAMPP_PATH%\xampp_start.exe" "mysql" >nul 2>&1
        timeout /t 3 /nobreak > nul
    ) else (
        echo      [❌] Cannot start MySQL automatically.
        echo      Please open XAMPP Control Panel and start MySQL manually.
        echo.
        echo      Opening XAMPP Control Panel for you...
        start "" "%XAMPP_PATH%\xampp-control.exe"
        echo.
        echo      After starting MySQL successfully, press any key to continue...
        pause >nul
    )
    
    :: Final verification check
    tasklist /fi "imagename eq mysqld.exe" 2>nul | find /i "mysqld.exe" >nul
    if %errorlevel% equ 0 (
        echo      [✅] MySQL server started successfully.
    ) else (
        echo      [❌] MySQL server is still stopped.
        echo      Please ensure it is active via XAMPP Control Panel first.
        pause
        exit /b 1
    )
)

echo.
echo 2. Terminating conflicting Node.js background instances...
taskkill /f /im node.exe >nul 2>&1
echo      [✅] Port cleanup completed successfully.

echo.
echo 3. Launching backend Node.js server...

:: Navigate directly to the project directory
cd /d "%PROJECT_PATH%"

:: Ensure server.js file exists in the directory
if not exist "server.js" (
    echo      [❌] Critical Error: server.js file not found!
    echo      Target Path: %PROJECT_PATH%\server.js
    pause
    exit /b 1
)

:: Run the server in background process mode
start /B node server.js >nul 2>&1

echo      [✅] Backend server launched successfully.

echo.
echo 4. Stabilizing server connection (waiting 3 seconds)...
timeout /t 3 /nobreak > nul

:: Open system view in the default web browser environment
echo 5. Launching Al-Azeza main interface application...

:: Open URL directly in Microsoft Edge
start "" "msedge.exe" "http://localhost:3000/"

echo.
echo ===================================================
echo      ✅ Platform Launched Successfully, Dr. Hafez!
echo.
echo      🌐 Local System URL: http://localhost:3000
echo      📁 Current Directory: %PROJECT_PATH%
echo      🌐 Target Browser: Microsoft Edge
echo ===================================================
echo.
echo 💡 Important Operational Notes:
echo      - Do NOT close this terminal window while using the platform.
echo      - To terminate the server later: Close this window or press Ctrl+C.
echo      - You can minimize this window safely to continue your workflow.
echo.

:: Keep window static for error or process reports
pause