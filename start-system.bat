@echo off
title PUP-CpE OJT Tracking & Employer Database System — Group 8 Launcher
echo ============================================================================
echo   POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
echo   College of Engineering — Computer Engineering Department (Sta. Mesa)
echo   Internship / OJT Tracking and Employer Database System (Group 8)
echo ============================================================================
echo.

echo [1/4] Starting XAMPP MySQL / MariaDB Server (Port 3306)...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       MySQL is already running.
) else (
    start /B "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
    timeout /t 3 /nobreak >NUL
    echo       MySQL started successfully.
)

echo [2/4] Ensuring Database Schema (ojt_tracking_db) is Initialized...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "USE ojt_tracking_db; SHOW TABLES LIKE 'Users';" 2>NUL | find /I "Users" >NUL
if not "%ERRORLEVEL%"=="0" (
    echo       Importing database\schema_and_seed.sql...
    "C:\xampp\mysql\bin\mysql.exe" -u root < "%~dp0database\schema_and_seed.sql"
    echo       Database initialized with Group 8 seed data.
) else (
    echo       Database ojt_tracking_db verified ready.
)

echo [3/4] Starting PHP 8.2 REST API Server on http://127.0.0.1:8000 ...
start "PUP-CpE PHP API Server" /MIN "C:\xampp\php\php.exe" -S 127.0.0.1:8000 "%~dp0backend\router.php"

echo [4/4] Starting React (Vite) Frontend Server on http://127.0.0.1:5173 ...
echo.
echo   - Development App URL:  http://127.0.0.1:5173
echo   - Production Build URL: http://127.0.0.1:8000
echo   - Demo Login Password:  password123
echo.
npm run dev
