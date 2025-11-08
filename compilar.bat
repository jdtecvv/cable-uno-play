@echo off
REM Script de Compilacion Automatica - Cable Uno Play APK (Windows)
REM Ejecutar: compilar.bat

echo.
echo ================================================
echo   Cable Uno Play - Compilacion APK
echo ================================================
echo.

REM Verificar Node.js
echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Descargar de: https://nodejs.org/
    pause
    exit /b 1
)
node --version

REM Verificar Java
echo Verificando Java...
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java no esta instalado
    echo Descargar de: https://adoptium.net/
    pause
    exit /b 1
)
java -version

REM Verificar JAVA_HOME
if "%JAVA_HOME%"=="" (
    echo ADVERTENCIA: JAVA_HOME no esta configurado
    echo Configurar en variables de entorno
)

echo.
echo [1/4] Instalando dependencias...
call npm install
if errorlevel 1 (
    echo ERROR en npm install
    pause
    exit /b 1
)

echo.
echo [2/4] Compilando frontend...
call npm run build
if errorlevel 1 (
    echo ERROR en npm run build
    pause
    exit /b 1
)

echo.
echo [3/4] Sincronizando con Android...
call npx cap sync android
if errorlevel 1 (
    echo ERROR en cap sync
    pause
    exit /b 1
)

echo.
echo [4/4] Abriendo Android Studio...
echo.
echo ================================================
echo   SIGUIENTE PASO:
echo   1. Esperar a que Gradle sincronice
echo   2. Build - Build APK(s)
echo   3. APK en: android\app\build\outputs\apk\debug\
echo ================================================
echo.

call npx cap open android

echo.
echo Proceso completado
echo Ahora compila el APK en Android Studio
pause
