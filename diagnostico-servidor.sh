#!/bin/bash

echo "=========================================="
echo "🔍 DIAGNÓSTICO CABLE UNO PLAY"
echo "=========================================="
echo ""

echo "1️⃣ Estado de PM2:"
pm2 list
echo ""

echo "2️⃣ Logs recientes (últimas 30 líneas):"
pm2 logs cable-uno-play --lines 30 --nostream
echo ""

echo "3️⃣ Estado del puerto 5000:"
netstat -tuln | grep 5000
echo ""

echo "4️⃣ Variable DATABASE_URL configurada:"
pm2 env 0 | grep DATABASE_URL
echo ""

echo "5️⃣ Configuración de Nginx:"
nginx -t
echo ""

echo "6️⃣ Test de conexión HTTP local:"
curl -I http://localhost:5000 2>&1 | head -10
echo ""

echo "7️⃣ Procesos Node.js corriendo:"
ps aux | grep node | grep -v grep
echo ""

echo "=========================================="
echo "✅ Diagnóstico completo"
echo "=========================================="
