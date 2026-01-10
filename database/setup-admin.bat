@echo off
REM ============================================================
REM ADMIN FEATURE - PHASE 1 COMPLETE SETUP SCRIPT (Windows)
REM ============================================================
REM Purpose: Execute all SQL files in correct order and run tests
REM Usage: Run this from the 3movieCollectors directory
REM ============================================================

echo.
echo ========================================================================
echo   ADMIN FEATURE - PHASE 1 DATABASE SETUP
echo   This will execute all SQL files and run comprehensive tests
echo ========================================================================
echo.

REM Configuration
set MYSQL_USER=root
set MYSQL_DB=MovieCommunity
set DB_DIR=database

echo [1/7] Checking MySQL connection...
mysql -u %MYSQL_USER% -p -e "SELECT 'Connection successful!' as Status;" 2>nul
if errorlevel 1 (
    echo ERROR: Cannot connect to MySQL. Please check your credentials.
    pause
    exit /b 1
)
echo OK - MySQL connection verified
echo.

echo [2/7] Backing up current database...
set BACKUP_FILE=MovieCommunity_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
mysqldump -u %MYSQL_USER% -p %MYSQL_DB% > "%DB_DIR%\%BACKUP_FILE%"
if errorlevel 1 (
    echo WARNING: Backup failed, but continuing...
) else (
    echo OK - Database backed up to: %DB_DIR%\%BACKUP_FILE%
)
echo.

echo ========================================================================
echo   EXECUTING SQL FILES
echo ========================================================================
echo.

echo [3/7] Executing admin_schema.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_schema.sql"
if errorlevel 1 (
    echo ERROR: admin_schema.sql failed!
    pause
    exit /b 1
)
echo OK - Schema created
echo.

echo [4/7] Executing admin_triggers.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_triggers.sql"
if errorlevel 1 (
    echo ERROR: admin_triggers.sql failed!
    pause
    exit /b 1
)
echo OK - Triggers created
echo.

echo [5/7] Executing admin_procedures.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_procedures.sql"
if errorlevel 1 (
    echo ERROR: admin_procedures.sql failed!
    pause
    exit /b 1
)
echo OK - Procedures created
echo.

echo [6/7] Executing admin_functions.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_functions.sql"
if errorlevel 1 (
    echo ERROR: admin_functions.sql failed!
    pause
    exit /b 1
)
echo OK - Functions created
echo.

echo [7/7] Executing admin_privileges.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_privileges.sql"
if errorlevel 1 (
    echo ERROR: admin_privileges.sql failed!
    pause
    exit /b 1
)
echo OK - User privileges configured
echo.

echo [8/7] Executing admin_events.sql...
mysql -u %MYSQL_USER% -p %MYSQL_DB% < "%DB_DIR%\admin_events.sql"
if errorlevel 1 (
    echo ERROR: admin_events.sql failed!
    pause
    exit /b 1
)
echo OK - Scheduled events created
echo.

echo ========================================================================
echo   SQL FILES EXECUTED SUCCESSFULLY!
echo ========================================================================
echo.

echo Now running comprehensive tests...
echo.

REM Check if Node.js is available
where node >nul 2>nul
if errorlevel 1 (
    echo WARNING: Node.js not found. Skipping automated tests.
    echo Please run manually: node database\test-admin-db.js
    echo.
    goto :manual_verification
)

REM Check if mysql2 package is installed
if not exist "node_modules\mysql2" (
    echo Installing mysql2 package for testing...
    call npm install mysql2
)

REM Run tests
echo Running automated test suite...
echo.
node "%DB_DIR%\test-admin-db.js"
if errorlevel 1 (
    echo.
    echo WARNING: Some tests failed. Please review the output above.
    echo.
) else (
    echo.
    echo SUCCESS: All tests passed!
    echo.
)

goto :end

:manual_verification
echo ========================================================================
echo   MANUAL VERIFICATION STEPS
echo ========================================================================
echo.
echo Run these SQL queries to verify setup:
echo.
echo 1. Show all tables:
echo    USE MovieCommunity; SHOW TABLES;
echo.
echo 2. Count triggers:
echo    SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA='MovieCommunity';
echo.
echo 3. View dashboard stats:
echo    SELECT * FROM v_admin_dashboard_stats;
echo.
echo 4. Test a function:
echo    SELECT fn_is_admin(1);
echo.
echo 5. Test a procedure:
echo    CALL sp_get_top_watched_movies(5, 0);
echo.

:end
echo ========================================================================
echo   SETUP COMPLETE!
echo ========================================================================
echo.
echo Next steps:
echo 1. Review test results above
echo 2. Change default passwords in production:
echo    ALTER USER 'admin_user'@'localhost' IDENTIFIED BY 'YourSecurePassword';
echo 3. Proceed to Phase 2: Backend API Routes
echo.
echo Documentation: database\ADMIN_SETUP_GUIDE.md
echo.
pause
