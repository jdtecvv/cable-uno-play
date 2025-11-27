#!/bin/bash

# 🚀 Script para subir archivos actualizados al servidor
# Servidor: 190.61.110.177:2121

echo "📦 Cable Uno Play - Subir archivos al servidor"
echo "=============================================="
echo ""

# Configuración
SERVER_USER="cableuno"
SERVER_IP="190.61.110.177"
SERVER_PORT="2121"
SERVER_PATH="/home/cableuno/cable-uno-play"

echo "Servidor: $SERVER_USER@$SERVER_IP:$SERVER_PORT"
echo "Ruta destino: $SERVER_PATH"
echo ""

# Lista de archivos a subir
echo "📁 Archivos a subir:"
echo "  - simple-player.tsx (actualizado sin usuario/contraseña)"
echo "  - xui-player.tsx (NUEVO - versión XUI)"
echo "  - App.tsx (actualizado con nueva ruta)"
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

# Subir simple-player.tsx
echo "1/3 Subiendo simple-player.tsx..."
scp -P $SERVER_PORT \
  client/src/pages/simple-player.tsx \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/src/pages/

# Subir xui-player.tsx (NUEVO)
echo "2/3 Subiendo xui-player.tsx..."
scp -P $SERVER_PORT \
  client/src/pages/xui-player.tsx \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/src/pages/

# Subir App.tsx (actualizado)
echo "3/3 Subiendo App.tsx..."
scp -P $SERVER_PORT \
  client/src/App.tsx \
  $SERVER_USER@$SERVER_IP:$SERVER_PATH/client/src/

echo ""
echo "✅ Archivos subidos"
echo ""
echo "🔄 Conectando al servidor para reiniciar la aplicación..."
echo ""

# Reiniciar en el servidor
ssh -p $SERVER_PORT $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /home/cableuno/cable-uno-play
echo ""
echo "🔄 Reiniciando aplicación..."
DATABASE_URL="postgresql://cableuno:I@sd1844R0y@localhost:5432/cableuno_play" NODE_ENV=production pm2 restart cable-uno-play
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
echo "🌐 Verifica en:"
echo "   - Simple Player: https://play.teleunotv.cr/simple"
echo "   - XUI Player: https://play.teleunotv.cr/xui"
echo ""
