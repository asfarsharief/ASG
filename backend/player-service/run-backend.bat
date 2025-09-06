@echo off
echo Starting BadgerDB Backend Service...
echo.

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

echo Go version:
go version
echo.

echo Building the service...
go build -o player-service.exe main.go
if %errorlevel% neq 0 (
    echo.
    echo Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo Build successful! Starting the service...
echo Database will be stored in: ./data
echo API will be available at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the service
echo.

player-service.exe

