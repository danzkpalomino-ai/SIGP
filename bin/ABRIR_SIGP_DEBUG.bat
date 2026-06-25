@echo off
setlocal
title SIGP - DEBUG
set "PROJECT_DIR=%~dp0..\"

:: 1. Agregar Node Portable al PATH si existe (reusa el de SICCE)
if exist "%PROJECT_DIR%..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64" (
    set "PATH=%PROJECT_DIR%..\Proyecto de mejora\node-portable\node-v18.20.2-win-x64;%PATH%"
)

:: 2. Liberar puertos SIGP (3006 y 5174)
echo [SIGP] Verificando y liberando puertos ocupados...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3006, 5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo ==========================================
echo       INICIANDO SIGP (MODO DEBUG)
echo ==========================================

cd /d "%PROJECT_DIR%"

:: 1. Backend Node (Puerto 3006)
echo [+] Lanzando Backend (Puerto 3006)...
start "SIGP - Backend" cmd /k "cd /d %PROJECT_DIR%backend && npm start"

:: 2. Frontend (Puerto 5174)
echo [+] Lanzando Frontend (Vite - Puerto 5174)...
start "SIGP - Frontend" cmd /k "cd /d %PROJECT_DIR%frontend && npm run dev"

echo.
echo Esperando a que los servicios carguen...
timeout /t 6 /nobreak > nul
start http://localhost:5174

echo.
echo ==========================================
echo [OK] Los servicios de SIGP estan corriendo.
echo Puedes ver los logs en sus respectivas ventanas.
echo ==========================================
pause
