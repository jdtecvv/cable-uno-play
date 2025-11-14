#!/bin/bash

# 🚀 Script para subir archivos actualizados al servidor
# Servidor: 190.61.110.177:2121

echo "📦 Cable Uno Play - Subir archivos al servidor"
echo "=============================================="
echo ""

# Configuración
SERVER_USER="root"
SERVER_IP="190.61.110.177"
SERVER_PORT="2121"
SERVER_PATH="/var/www/cable-uno-play"  # Ajusta esta ruta si es diferente

echo "Servidor: $SERVER_USER@$SERVER_IP:$SERVER_PORT"
echo "Ruta destino: $SERVER_PATH"
echo ""

# Lista de archivos a subir
echo "📁 Archivos a subir:"
echo "  - Logo actualizado"
echo "  - Página Simple Player"
echo "  - Página Setup"
echo ""

read -p "¿Continuar? (s/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Cancelado."
    exit 1
fi

echo ""
echo "📤 Subiendo archivos..."
echo ""

# Subir logo
echo "1/3 Subiendo logo..."
scp -P $SERVER_PORT \
  client/public/images/cable-uno-logo.png \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/public/images/

# Subir simple-player.tsx
echo "2/3 Subiendo simple-player.tsx..."
scp -P $SERVER_PORT \
  client/src/pages/simple-player.tsx \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/src/pages/

# Subir setup.tsx
echo "3/3 Subiendo setup.tsx..."
scp -P $SERVER_PORT \
  client/src/pages/setup.tsx \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/src/pages/

echo ""
echo "✅ Archivos subidos"
echo ""
echo "🔄 Conectando al servidor para reiniciar la aplicación..."
echo ""

# Reiniciar en el servidor
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /var/www/cable-uno-play
echo "📦 Instalando dependencias (si hay cambios)..."
npm install
echo ""
echo "🔄 Reiniciando aplicación..."
pm2 restart cable-uno-play
echo ""
echo "📊 Estado de la aplicación:"
pm2 status cable-uno-play
echo ""
echo "📋 Últimos logs:"
pm2 logs cable-uno-play --lines 10 --nostream
ENDSSH

echo ""
echo "✅ ¡Actualización completada!"
echo ""
echo "🌐 Verifica en: https://play.teleunotv.cr"
echo ""
