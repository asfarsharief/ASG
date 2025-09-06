@echo off
echo Starting Player Service with BadgerDB (In-Memory NoSQL)...
echo.

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

REM Set database path
set DB_PATH=./data

echo Starting backend service with BadgerDB...
echo Database path: %DB_PATH%
echo.

go run main.go
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start the backend service
    echo.
    pause
    exit /b 1
)
