# 🚀 Instalación Automática en Servidor Linux

## ⚡ Instalación en 3 Pasos (10 minutos)

### **PASO 1: Conectar a tu servidor**

```bash
ssh usuario@tu-servidor.com
```

---

### **PASO 2: Descargar y ejecutar script**

#### Opción A: Desde URL (si está en GitHub)

```bash
curl -sSL https://raw.githubusercontent.com/TU_USUARIO/cable-uno-play/main/install-server.sh | sudo bash
```

#### Opción B: Subir archivo manualmente

**En tu Mac:**
```bash
scp install-server.sh usuario@tu-servidor.com:/tmp/
```

**En tu servidor:**
```bash
sudo bash /tmp/install-server.sh
```

---

### **PASO 3: Responder preguntas**

El script te preguntará:

```
📧 Tu correo electrónico (para SSL): tu@email.com
🌐 Tu dominio (ej: cableuno.com): midominio.com
🗄️  Contraseña para base de datos PostgreSQL: ********
📂 ¿Tienes repositorio Git del proyecto? (s/n): s
🔗 URL del repositorio Git: https://github.com/usuario/cable-uno-play.git
```

**Si NO tienes Git:**
- Responde `n` a "¿Tienes repositorio Git?"
- Sube el proyecto después con:
  ```bash
  scp -r cable-uno-play/ usuario@servidor:/var/www/cable-uno-play/
  ```

---

## ✅ ¿Qué hace el script automáticamente?

1. ✅ **Actualiza el sistema** (apt update/upgrade)
2. ✅ **Instala Node.js 20** (última versión LTS)
3. ✅ **Instala PostgreSQL** (base de datos)
4. ✅ **Crea base de datos** "cableuno_play"
5. ✅ **Instala PM2** (mantiene app corriendo 24/7)
6. ✅ **Clona proyecto** (desde Git o espera que lo subas)
7. ✅ **Instala dependencias** (npm install)
8. ✅ **Compila proyecto** (npm run build)
9. ✅ **Crea tablas** (npm run db:push)
10. ✅ **Inicia app con PM2** (auto-restart si falla)
11. ✅ **Instala Nginx** (web server)
12. ✅ **Configura Nginx** (proxy reverso)
13. ✅ **Configura SSL/HTTPS** (Let's Encrypt gratis)
14. ✅ **Configura firewall** (UFW - puertos 22, 80, 443)
15. ✅ **Backups automáticos** (PostgreSQL diario 2 AM)
16. ✅ **Crea script actualización** (update.sh)

---

## 🎯 Al terminar tendrás:

### 🌐 **App funcionando en:**
```
https://tu-dominio.com
```

### 📂 **Archivos en:**
```
/var/www/cable-uno-play/
```

### 📊 **Comandos útiles:**

```bash
# Ver estado de la app
pm2 status

# Ver logs en tiempo real
pm2 logs cable-uno-play

# Reiniciar app
pm2 restart cable-uno-play

# Actualizar app (si usas Git)
/var/www/cable-uno-play/update.sh

# Ver logs de Nginx
sudo tail -f /var/log/nginx/cableuno_error.log
sudo tail -f /var/log/nginx/cableuno_access.log

# Reiniciar Nginx
sudo systemctl restart nginx

# Estado de PostgreSQL
sudo systemctl status postgresql
```

---

## 🔧 Troubleshooting

### Script falla en algún paso

```bash
# Ver logs detallados
sudo bash install-server.sh 2>&1 | tee install.log
```

### App no carga después de instalación

```bash
# Verificar que PM2 está corriendo
pm2 status

# Ver errores
pm2 logs cable-uno-play --err

# Reiniciar
pm2 restart cable-uno-play
```

### Error de base de datos

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Ver logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Nginx error 502

```bash
# Verificar que la app está corriendo en puerto 5000
sudo netstat -tulpn | grep 5000

# Reiniciar PM2
pm2 restart cable-uno-play

# Reiniciar Nginx
sudo systemctl restart nginx
```

### SSL/HTTPS no funciona

```bash
# Verificar que el dominio apunta al servidor
nslookup tu-dominio.com

# Intentar obtener certificado manualmente
sudo certbot --nginx -d tu-dominio.com
```

---

## 📋 Requisitos Previos

Antes de ejecutar el script:

1. ✅ **Servidor Linux** (Ubuntu 20.04+, Debian 11+)
2. ✅ **Acceso SSH con sudo**
3. ✅ **Dominio** apuntando al servidor (para SSL)
4. ✅ **Email** (para notificaciones SSL)
5. ✅ **Proyecto** (Git repo O archivos listos para subir)

---

## 🔒 Seguridad

El script configura automáticamente:

- ✅ **Firewall UFW** (solo puertos necesarios)
- ✅ **SSL/HTTPS** (Let's Encrypt)
- ✅ **Contraseñas seguras** para PostgreSQL
- ✅ **Archivo .env protegido** (permisos 600)
- ✅ **Backups diarios** de base de datos

**Recomendaciones adicionales:**

```bash
# Cambiar puerto SSH (opcional)
sudo nano /etc/ssh/sshd_config
# Cambiar: Port 22 → Port 2222
sudo systemctl restart sshd

# Instalar Fail2Ban (protección brute force)
sudo apt install fail2ban
```

---

## 🔄 Actualizar la App

### Con Git (automático):

```bash
/var/www/cable-uno-play/update.sh
```

### Manual:

```bash
cd /var/www/cable-uno-play
npm install
npm run build
npm run db:push
pm2 restart cable-uno-play
```

---

## 💾 Backups

### Backups automáticos:
- 📅 **Diario a las 2 AM**
- 📂 **Ubicación:** `~/backups/cableuno/`
- 🗑️ **Retención:** 7 días

### Backup manual:

```bash
~/backup-cableuno.sh
```

### Restaurar backup:

```bash
psql -U cableuno -d cableuno_play < ~/backups/cableuno/db_backup_20250101_020000.sql
```

---

## 📞 Soporte

Si el script falla:

1. **Copia el mensaje de error completo**
2. **Verifica que el dominio apunta al servidor:**
   ```bash
   nslookup tu-dominio.com
   ```
3. **Ejecuta el script con logs:**
   ```bash
   sudo bash install-server.sh 2>&1 | tee install.log
   ```
4. **Comparte el archivo `install.log`**

---

## 🎉 ¡Listo!

Con este script, tu aplicación **Cable Uno Play** estará:

- ✅ Corriendo 24/7
- ✅ Con HTTPS seguro
- ✅ Con backups automáticos
- ✅ Lista para producción

**Tiempo total:** ⏱️ 10-15 minutos
