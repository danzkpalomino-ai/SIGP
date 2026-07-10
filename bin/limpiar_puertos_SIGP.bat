@echo off
REM Limpia los puertos usados por SIGP (backend 3006, frontend 5174)
echo [SIGP] Liberando puertos 3006 y 5174...
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3006,5174 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul
echo [SIGP] Puertos liberados.