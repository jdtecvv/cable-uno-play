#!/bin/bash

# 🍎 Script de Compilación iOS - Cable Uno Play
# Automatiza el proceso de build y apertura en Xcode

echo "🍎 Cable Uno Play - Compilación iOS"
echo "===================================="
echo ""

# Verificar que estamos en un Mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: Este script solo funciona en macOS"
    echo "   Para iOS necesitas un Mac con Xcode instalado"
    exit 1
fi

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "   Instala Node.js con: brew install node@20"
    exit 1
fi

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ Verificaciones iniciales completas"
echo ""

# Paso 1: Instalar dependencias
echo "📦 Paso 1/6: Instalando dependencias..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi
echo "✅ Dependencias instaladas"
echo ""

# Paso 2: Instalar Capacitor iOS (si no está instalado)
echo "📱 Paso 2/6: Verificando Capacitor iOS..."
if ! grep -q "@capacitor/ios" package.json; then
    echo "   Instalando @capacitor/ios..."
    npm install @capacitor/ios
fi
echo "✅ Capacitor iOS listo"
echo ""

# Paso 3: Build de producción
echo "🔨 Paso 3/6: Compilando aplicación web..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi
echo "✅ Build completado"
echo ""

# Paso 4: Agregar plataforma iOS (si no existe)
echo "📱 Paso 4/6: Configurando plataforma iOS..."
if [ ! -d "ios" ]; then
    echo "   Creando proyecto iOS..."
    npx cap add ios
    if [ $? -ne 0 ]; then
        echo "❌ Error agregando plataforma iOS"
        exit 1
    fi
    echo "✅ Plataforma iOS creada"
else
    echo "✅ Plataforma iOS ya existe"
fi
echo ""

# Paso 5: Sincronizar código
echo "🔄 Paso 5/6: Sincronizando código con iOS..."
npx cap sync ios
if [ $? -ne 0 ]; then
    echo "❌ Error sincronizando con iOS"
    exit 1
fi
echo "✅ Sincronización completa"
echo ""

# Paso 6: Abrir Xcode
echo "🚀 Paso 6/6: Abriendo Xcode..."
npx cap open ios

echo ""
echo "✅ ¡Proceso completado!"
echo ""
echo "📱 Siguiente paso:"
echo "   1. Xcode se abrirá automáticamente"
echo "   2. Selecciona tu dispositivo o simulador"
echo "   3. Click en ▶️ (Play) para compilar e instalar"
echo ""
echo "📚 Documentación completa: COMPILAR_IOS.md"
echo ""
