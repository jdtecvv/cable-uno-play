#!/bin/bash

# 🔨 Script de Compilación Automática - Cable Uno Play APK
# Ejecutar: bash compilar.sh

set -e  # Detener si hay errores

echo "🚀 Cable Uno Play - Compilación APK"
echo "===================================="
echo ""

# Verificar Node.js
echo "✓ Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Descargar de: https://nodejs.org/"
    exit 1
fi
echo "  Node.js: $(node --version)"

# Verificar Java
echo "✓ Verificando Java..."
if ! command -v java &> /dev/null; then
    echo "❌ Java no está instalado"
    echo "   Descargar de: https://adoptium.net/"
    exit 1
fi
echo "  Java: $(java -version 2>&1 | head -n 1)"

# Verificar JAVA_HOME
if [ -z "$JAVA_HOME" ]; then
    echo "⚠️  JAVA_HOME no está configurado"
    echo "   Configurar en variables de entorno"
fi

echo ""
echo "📦 Paso 1/4: Instalando dependencias..."
npm install

echo ""
echo "🏗️  Paso 2/4: Compilando frontend..."
npm run build

echo ""
echo "🔄 Paso 3/4: Sincronizando con Android..."
npx cap sync android

echo ""
echo "📱 Paso 4/4: Abriendo Android Studio..."
echo ""
echo "SIGUIENTE PASO:"
echo "1. Esperar a que Gradle sincronice"
echo "2. Build → Build APK(s)"
echo "3. APK estará en: android/app/build/outputs/apk/debug/"
echo ""

npx cap open android

echo ""
echo "✅ Proceso completado"
echo "   Ahora compila el APK en Android Studio"
