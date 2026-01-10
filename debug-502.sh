#!/bin/bash
echo "=========================================="
echo "🔍 DEBUG 502 BAD GATEWAY"
echo "=========================================="

echo "1. Verificando puerto 5000 (Node.js)..."
sudo netstat -tulpn | grep 5000 || echo "❌ NADA escuchando en puerto 5000"

echo -e "\n2. Verificando logs de Nginx (últimos 20)..."
if [ -f /var/log/nginx/cableuno_error.log ]; then
    sudo tail -n 20 /var/log/nginx/cableuno_error.log
else
    echo "❌ No se encontró el log de errores de Nginx"
fi

echo -e "\n3. Verificando logs de PM2 (App)..."
pm2 logs cable-uno-play --lines 20 --nostream

echo -e "\n4. Probando conexión local..."
curl -v http://127.0.0.1:5000/api/.env 2>&1 | head -n 10

echo "=========================================="
echo "Copia y pega este resultado en el chat"
echo "=========================================="
