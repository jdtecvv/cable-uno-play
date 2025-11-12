#!/bin/bash

# Script para configurar Cable Uno Play iOS en modo PRODUCCIÓN
# Restaura la configuración sin server.url para compilar APK/IPA final

echo "🚀 Configurando Cable Uno Play para producción iOS..."
echo ""

# Restaurar config de producción (sin server.url)
cat > capacitor.config.ts << EOF
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cableuno.play',
  appName: 'Cable Uno Play',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;
EOF

echo "✅ capacitor.config.ts configurado para producción"
echo "   (Sin server.url - la app cargará desde el bundle)"
echo ""

# Build y sync
echo "📦 Compilando frontend..."
npm run build

echo ""
echo "📱 Sincronizando con iOS..."
npx cap sync ios

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos para compilar IPA:"
echo "   1. Abre Xcode: open ios/App/App.xcworkspace"
echo "   2. Selecciona 'Any iOS Device (arm64)' como target"
echo "   3. Product → Archive"
echo "   4. Distribute App → App Store Connect / Ad Hoc / Development"
echo ""
echo "ℹ️  La app en producción soporta:"
echo "   ✅ URLs HTTP (red interna): http://190.61.110.177:2728/..."
echo "   ✅ URLs HTTPS (internet): https://play.teleunotv.cr"
echo ""
echo "⚠️  Para volver a desarrollo, ejecuta ./config-dev-ios.sh"
echo ""
