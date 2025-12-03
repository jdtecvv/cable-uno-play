# 🐧 Deployment en Servidor Linux - Cable Uno Play

## 🎯 Requisitos del Servidor

### Mínimos:
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- 1 GB RAM
- 10 GB disco
- Node.js 20+
- Nginx (opcional, recomendado)

---

## 📥 PASO 1: Preparar Servidor

### Conectar por SSH:

```bash
ssh usuario@tu-servidor.com
```

### Actualizar sistema:

```bash
sudo apt update
sudo apt upgrade -y
```

### Instalar dependencias básicas:

```bash
sudo apt install -y curl wget git build-essential
```

---

## 📦 PASO 2: Instalar Node.js 20

```bash
# Agregar repositorio NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar
node --version
npm --version
```

---

## 🚀 PASO 3: Subir Proyecto al Servidor

### Opción A: Git (Recomendada)

**1. Crear repositorio en GitHub (si no lo hiciste):**
- En Replit: Tools → Git → Create GitHub repository

**2. En el servidor, clonar:**

```bash
cd /var/www
sudo mkdir cable-uno-play
sudo chown $USER:$USER cable-uno-play
cd cable-uno-play

git clone https://github.com/TU_USUARIO/cable-uno-play.git .
```

### Opción B: SCP desde tu Mac

```bash
# En tu Mac (desde la carpeta del proyecto)
scp -r cable-uno-play usuario@tu-servidor.com:/var/www/

# O comprimir primero
tar -czf cable-uno-play.tar.gz cable-uno-play/
scp cable-uno-play.tar.gz usuario@tu-servidor.com:/tmp/

# En el servidor
cd /var/www
tar -xzf /tmp/cable-uno-play.tar.gz
```

---

## ⚙️ PASO 4: Configurar Proyecto

### 1. Instalar dependencias:

```bash
cd /var/www/cable-uno-play
npm install
```

### 2. Configurar variables de entorno:

```bash
nano .env
```

**Contenido:**

```env
# Node
NODE_ENV=production
PORT=5000

# Host (para producción)
HOST=0.0.0.0
```

### 3. Crear base de datos local:

```bash
npm run db:migrate
```

### 4. (Opcional) Poblar con datos de prueba:

```bash
npm run db:seed
```

### 5. Build de producción:

```bash
npm run build
```

---

## 🔧 PASO 5: Configurar PM2 (Process Manager)

PM2 mantiene tu app corriendo 24/7:

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Iniciar aplicación
pm2 start dist/index.js --name cable-uno-play

# Configurar inicio automático
pm2 startup
pm2 save

# Ver logs
pm2 logs cable-uno-play

# Ver estado
pm2 status
```

### Comandos útiles PM2:

```bash
pm2 restart cable-uno-play    # Reiniciar
pm2 stop cable-uno-play       # Detener
pm2 delete cable-uno-play     # Eliminar
pm2 monit                      # Monitor en tiempo real
```

---

## 🌐 PASO 6: Configurar Nginx (Reverse Proxy)

### Instalar Nginx:

```bash
sudo apt install -y nginx
```

### Crear configuración:

```bash
sudo nano /etc/nginx/sites-available/cable-uno-play
```

**Contenido:**

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    # Logs
    access_log /var/log/nginx/cableuno_access.log;
    error_log /var/log/nginx/cableuno_error.log;

    # Proxy a Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para streaming
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Archivos estáticos
    location /assets {
        alias /var/www/cable-uno-play/dist/public/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /images {
        alias /var/www/cable-uno-play/client/public/images;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Tamaño máximo de subida
    client_max_body_size 100M;
}
```

### Habilitar sitio:

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/cable-uno-play /etc/nginx/sites-enabled/

# Probar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

---

## 🔒 PASO 7: Configurar SSL (HTTPS)

### Instalar Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Obtener certificado SSL gratis:

```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

**Certbot automáticamente:**
- ✅ Obtiene certificado SSL
- ✅ Configura Nginx para HTTPS
- ✅ Redirige HTTP → HTTPS

### Renovación automática:

```bash
# Probar renovación
sudo certbot renew --dry-run

# Certbot ya configuró cron para auto-renovación
```

---

## 🔥 PASO 8: Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh
sudo ufw allow 22

# Permitir HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Ver reglas
sudo ufw status
```

---

## 📊 PASO 9: Monitoreo y Logs

### Ver logs de la aplicación:

```bash
# PM2 logs
pm2 logs cable-uno-play

# Logs en tiempo real
pm2 logs cable-uno-play --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/cableuno_access.log
sudo tail -f /var/log/nginx/cableuno_error.log
```

### Monitoreo de recursos:

```bash
# Estado de PM2
pm2 monit

# Estado del servidor
htop

# Espacio en disco
df -h

# Memoria RAM
free -h
```

---

## 🔄 PASO 10: Actualizar la Aplicación

### Método automático (Git):

```bash
cd /var/www/cable-uno-play

# Pull cambios
git pull origin main

# Instalar dependencias nuevas (si hay)
npm install

# Rebuild
npm run build

# Actualizar base de datos (si hay cambios en schema)
npm run db:migrate

# Reiniciar aplicación
pm2 restart cable-uno-play
```

### Script de actualización:

```bash
nano update.sh
```

**Contenido:**

```bash
#!/bin/bash
set -e

echo "🔄 Actualizando Cable Uno Play..."

cd /var/www/cable-uno-play

echo "📥 Descargando cambios..."
git pull origin main

echo "📦 Instalando dependencias..."
npm install

echo "🏗️  Compilando..."
npm run build

echo "🗄️  Actualizando base de datos..."
npm run db:migrate

echo "🔄 Reiniciando aplicación..."
pm2 restart cable-uno-play

echo "✅ ¡Actualización completada!"
pm2 status
```

**Hacer ejecutable:**

```bash
chmod +x update.sh
```

**Usar:**

```bash
./update.sh
```

---

## 🔐 PASO 11: Seguridad Adicional

### 1. Cambiar puerto SSH:

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar: Port 22 → Port 2222
sudo systemctl restart sshd
```

### 2. Deshabilitar login root:

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar: PermitRootLogin yes → PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Fail2Ban (protección contra brute force):

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Backups automáticos de BD:

```bash
# Crear script de backup
nano /home/usuario/backup-db.sh
```

**Contenido:**

```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="/var/www/cable-uno-play/local.db"
mkdir -p $BACKUP_DIR

cp $DB_FILE "$BACKUP_DIR/backup_$DATE.db"

# Mantener solo últimos 7 días
find $BACKUP_DIR -name "backup_*.db" -mtime +7 -delete

echo "✅ Backup completado: backup_$DATE.db"
```

**Hacer ejecutable:**

```bash
chmod +x /home/usuario/backup-db.sh
```

**Configurar cron (diario a las 2 AM):**

```bash
crontab -e

# Agregar:
0 2 * * * /home/usuario/backup-db.sh
```

---

## ✅ Checklist Deployment

- [ ] Servidor Linux preparado
- [ ] Node.js 20 instalado
- [ ] Proyecto subido al servidor
- [ ] Variables de entorno configuradas (.env)
- [ ] Dependencias instaladas (npm install)
- [ ] Base de datos creada (npm run db:migrate)
- [ ] Build de producción (npm run build)
- [ ] PM2 instalado y configurado
- [ ] Aplicación corriendo con PM2
- [ ] Nginx instalado y configurado
- [ ] Dominio apuntando al servidor
- [ ] SSL configurado (HTTPS)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] App accesible desde internet

---

## 🌐 Acceso a tu App

Después de completar todos los pasos:

**HTTP:** `http://tu-dominio.com`
**HTTPS:** `https://tu-dominio.com` (recomendado)

---

## 📞 Comandos Útiles

```bash
# Estado de servicios
sudo systemctl status nginx
pm2 status

# Reiniciar servicios
sudo systemctl restart nginx
pm2 restart cable-uno-play

# Ver logs
pm2 logs cable-uno-play
sudo tail -f /var/log/nginx/error.log

# Recursos del servidor
htop
df -h
free -h
```

---

## 🆘 Troubleshooting

### App no carga:

```bash
# Verificar que está corriendo
pm2 status

# Ver logs de errores
pm2 logs cable-uno-play --err

# Verificar puerto
sudo netstat -tulpn | grep 5000
```

### Error de base de datos:

```bash
# Verificar que el archivo de base de datos existe
ls -l /var/www/cable-uno-play/local.db
```

### Nginx error:

```bash
# Probar configuración
sudo nginx -t

# Ver logs
sudo tail -f /var/log/nginx/error.log

# Reiniciar
sudo systemctl restart nginx
```

---

## 🎉 ¡Listo!

Tu aplicación **Cable Uno Play** está ahora:

✅ **Corriendo 24/7** con PM2
✅ **Accesible** desde tu dominio
✅ **Segura** con HTTPS
✅ **Optimizada** con Nginx
✅ **Respaldada** con backups automáticos
✅ **Lista para producción**

**Tu servidor Linux ahora sirve:**
- 🌐 Web app (React + Express)
- 📺 Streaming IPTV
- 🗄️ Base de datos SQLite local
- 🔒 Conexión segura HTTPS
