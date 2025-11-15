#!/bin/bash

echo "🎨 Instalando icono Cable Uno Play con @capacitor/assets..."
echo ""

# Verificar que existe el icono
if [ ! -f "icon-1024.png" ]; then
    echo "❌ ERROR: No se encuentra icon-1024.png"
    echo "   Descarga el icono primero y colócalo en la raíz del proyecto"
    exit 1
fi

echo "✅ Icono encontrado: icon-1024.png"
echo ""

# Instalar @capacitor/assets si no está instalado
if ! npm list @capacitor/assets > /dev/null 2>&1; then
    echo "📦 Instalando @capacitor/assets..."
    npm install --save-dev @capacitor/assets
    echo ""
fi

# Crear directorio assets si no existe
echo "📁 Creando directorio assets/..."
mkdir -p assets

# Copiar icono a assets con nombre correcto
echo "📋 Copiando icono a assets/icon.png..."
cp icon-1024.png assets/icon.png

# Generar todos los iconos automáticamente
echo ""
echo "🎨 Generando iconos para iOS, Android y PWA..."
echo "   (Esto puede tardar unos segundos...)"
echo ""

npx @capacitor/assets generate \
  --iconBackgroundColor '#000000' \
  --iconBackgroundColorDark '#000000' \
  --splashBackgroundColor '#000000' \
  --splashBackgroundColorDark '#000000'

# Sincronizar con Capacitor
echo ""
echo "🔄 Sincronizando con Capacitor..."

if [ -d "ios" ]; then
    echo "   📱 Sincronizando iOS..."
    npx cap sync ios
fi

if [ -d "android" ]; then
    echo "   🤖 Sincronizando Android..."
    npx cap sync android
fi

echo ""
echo "✅ ¡Icono instalado correctamente en todas las plataformas!"
echo ""
echo "📋 Ubicaciones:"
echo "   - iOS:     ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo "   - Android: android/app/src/main/res/mipmap-*/"
echo "   - PWA:     public/assets/"
echo ""
echo "📱 Próximos pasos:"
echo "   1. Para iOS: Abre Xcode y verifica el icono"
echo "   2. Para Android: Compila el APK para ver el nuevo icono"
echo "   3. Para PWA: El icono se actualizará automáticamente"
echo ""
