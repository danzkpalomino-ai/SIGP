@echo off
title SIGP — DEBUG
color 0F
cls
echo ============================================
echo    SIGP — Modo DEBUG
echo    Presiona Ctrl+C para detener
echo ============================================
echo.

cd /d "%~dp0..\backend"
echo [SIGP] Iniciando servidor...
node src\index.js

echo.
echo [SIGP] Servidor detenido.
pause
