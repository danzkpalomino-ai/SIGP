@echo off
setlocal
title SIGP - DEBUG
set "PROJECT_DIR=%~dp0..\"
set "SICCE_DIR=%PROJECT_DIR%..\Proyecto de mejora\"

:: 1. Agregar Node Portable al PATH si existe (reusa el de SICCE)
if exist "%SICCE_DIR%node-portable\node-v18.20.2-win-x64" (
    set "PATH=%SICCE_DIR%node-portable\node-v18.20.2-win-x64;%PATH%"
)

:: 2. Liberar puertos SIGP (3006 y 5174)
echo [SIGP] Verificando puertos...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3006, 5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo ==========================================
echo       INICIANDO SIGP (MODO DEBUG)
echo ==========================================

cd /d "%PROJECT_DIR%"

:: 3. Backend SIGP (Puerto 3006)
echo [+] Lanzando Backend SIGP (Puerto 3006)...
start "SIGP - Backend" cmd /k "cd /d %PROJECT_DIR%backend && npm start"

:: 4. Frontend SIGP (Puerto 5174)
echo [+] Lanzando Frontend SIGP (Vite - Puerto 5174)...
start "SIGP - Frontend" cmd /k "cd /d %PROJECT_DIR%frontend && npm run dev"

echo.
echo Esperando a que los servicios carguen...
timeout /t 6 /nobreak > nul
start http://localhost:5174

echo.
echo ==========================================
echo [OK] SIGP esta corriendo.
echo ==========================================
pause
