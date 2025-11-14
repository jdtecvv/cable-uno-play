#!/bin/bash

# Script para configurar Cable Uno Play iOS en modo DESARROLLO
# Detecta automáticamente la IP del Mac y configura Capacitor

echo "🔧 Configurando Cable Uno Play para desarrollo iOS..."
echo ""

# Detectar IP local del Mac
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ Error: No se pudo detectar la IP local del Mac"
    echo "Por favor ejecuta manualmente: ifconfig | grep 'inet '"
    exit 1
fi

echo "✅ IP local detectada: $IP"

# Usar puerto de variable de entorno PORT (default: 3000 para Mac)
# En Mac usamos 3000 porque 5000 suele estar ocupado
PORT="${PORT:-3000}"
echo "✅ Puerto configurado: $PORT"
echo ""

# Hacer backup del config original
if [ ! -f "capacitor.config.ts.backup" ]; then
    cp capacitor.config.ts capacitor.config.ts.backup
    echo "✅ Backup creado: capacitor.config.ts.backup"
fi

# Crear configuración de desarrollo
cat > capacitor.config.ts << EOF
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cableuno.play',
  appName: 'Cable Uno Play',
  webDir: 'dist/public',
  server: {
    url: 'http://${IP}:${PORT}',
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

echo "✅ capacitor.config.ts configurado para desarrollo"
echo "   URL del servidor: http://${IP}:${PORT}"
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
echo "📋 Próximos pasos:"
echo "   1. En OTRA terminal, inicia el servidor: PORT=${PORT} npm run dev"
echo "   2. Espera a ver: [express] serving on port ${PORT}"
echo "   3. Abre Xcode: open ios/App/App.xcworkspace"
echo "   4. En Xcode: Product → Clean Build Folder (Shift + Cmd + K)"
echo "   5. Click ▶️ Play para ejecutar en el Simulator"
echo ""
echo "ℹ️  El servidor correrá SIN base de datos (solo Simple Player)"
echo "⚠️  IMPORTANTE: Antes de compilar para producción, ejecuta ./config-prod-ios.sh"
echo ""
