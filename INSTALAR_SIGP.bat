@echo off
setlocal
title SIGP - Instalador Portable
color 0F

:: Verificar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [SIGP] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Verificar recursos
if not exist "%~dp0setup_wizard\installer_sigp.ps1" (
    echo [ERROR] No se encuentra el instalador en setup_wizard\installer_sigp.ps1
    pause
    exit /b 1
)

:: Detectar estado
if exist "%~dp0backend\node_modules" (
    echo [INFO] Instalacion existente detectada
) else (
    echo [INFO] Primera instalacion
)

:: Lanzar interfaz grafica
powershell -STA -ExecutionPolicy Bypass -File "%~dp0setup_wizard\installer_sigp.ps1"

if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al lanzar la interfaz.
    pause
)

exit
