@echo off
echo Starting Player Service Backend with MongoDB...
echo.

REM Check if Go is installed
go version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Go is not installed or not in PATH
    echo Please install Go from https://golang.org/dl/
    pause
    exit /b 1
)

REM Set MongoDB URI
set MONGODB_URI=mongodb://localhost:27017/asg_db

echo Starting backend service...
echo MongoDB URI: %MONGODB_URI%
echo.

go run main.go
if %errorlevel% neq 0 (
    echo.
    echo Error: Failed to start the backend service
    echo Make sure MongoDB is running on localhost:27017
    echo.
    echo To start MongoDB with Docker:
    echo   docker-compose up -d mongodb
    echo.
    pause
    exit /b 1
)
