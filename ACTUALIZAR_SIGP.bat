@echo off
title SIGP - Actualizador
color 0F
cls

echo ============================================
echo    SIGP - Actualizador v0.1
echo ============================================
echo.

:: Verificar que estamos en un repo git
if not exist ".git" (
    echo [X] No se encontrO el repositorio git.
    echo     AsegUrate de ejecutar este script desde
    echo     la carpeta raIz de SIGP.
    pause
    exit /b 1
)
echo [✓] Repositorio git encontrado
echo.

:: Fetch
echo [1/4] Obteniendo actualizaciones...
git fetch origin
if %ERRORLEVEL% neq 0 (
    echo [X] Error al obtener actualizaciones. Verifica tu conexiOn.
    pause
    exit /b 1
)
echo [✓] Actualizaciones obtenidas
echo.

:: Verificar si hay cambios
git diff --quiet HEAD origin/main
if %ERRORLEVEL% equ 0 (
    echo [i] Ya estAs en la Ultima versiOn.
    pause
    exit /b 0
)

:: Pull
echo [2/4] Aplicando cambios...
git pull origin main
if %ERRORLEVEL% neq 0 (
    echo [X] Error al aplicar cambios. Puede haber conflictos.
    pause
    exit /b 1
)
echo [✓] Cambios aplicados
echo.

:: Reinstalar dependencias
echo [3/4] Actualizando dependencias...
cd backend
call npm install
cd ..\frontend
call npm install
cd ..
echo [✓] Dependencias actualizadas
echo.

:: Rebuild
echo [4/4] Recompilando frontend...
cd frontend
call npm run build
cd ..
echo [✓] Frontend recompilado
echo.
echo ============================================
echo    ActualizaciOn completada
echo ============================================
echo.
pause
