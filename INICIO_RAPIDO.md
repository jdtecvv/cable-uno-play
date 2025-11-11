# 🚀 Cable Uno Play - Inicio Rápido

## 🎯 ¿Qué quieres hacer?

### 📱 **Compilar APK para Android**

**Mac:**
```bash
# 1. Instalar herramientas (primera vez)
brew install node@20
brew install --cask temurin17

# 2. Descargar proyecto
# (Desde Replit: ⋮ → Download as ZIP)

# 3. Compilar
chmod +x compilar.sh
./compilar.sh

# 4. Abrir Android Studio y compilar APK
```

📖 **Guía completa:** `COMPILAR_MAC.md`

---

### 🐧 **Instalar en Servidor Linux** (AUTOMÁTICO)

```bash
# 1. Conectar a servidor
ssh usuario@tu-servidor.com

# 2. Descargar script
wget https://raw.githubusercontent.com/TU_USUARIO/cable-uno-play/main/install-server.sh

# 3. Ejecutar (10-15 minutos)
sudo bash install-server.sh

# Responder preguntas:
# - Email para SSL
# - Dominio
# - Contraseña de BD
# - URL de Git (opcional)

# ✅ Listo! App en: https://tu-dominio.com
```

📖 **Guía completa:** `INSTALACION_AUTOMATICA.md`

---

### 💻 **Desarrollo Local (Replit)**

```bash
# Ya está todo configurado
npm run dev

# App en: https://tu-repl.replit.app
```

---

## 📁 Archivos Importantes

### Compilación Android
- `COMPILAR_MAC.md` - Guía completa para Mac
- `compilar.sh` - Script automático de compilación
- `capacitor.config.ts` - Configuración de Capacitor
- `.github/workflows/build-apk.yml` - Compilación automática con GitHub Actions

### Deployment Linux
- `install-server.sh` - **Script automático** de instalación
- `INSTALACION_AUTOMATICA.md` - Guía de uso del script
- `DEPLOY_LINUX.md` - Guía manual detallada

### Documentación
- `replit.md` - Arquitectura y preferencias del proyecto
- `README.md` - Documentación general

---

## 🎯 Rutas Rápidas

### Quiero instalar en Android
→ **Mac:** Lee `COMPILAR_MAC.md`
→ **Windows:** Usa GitHub Actions (`.github/workflows/build-apk.yml`)

### Quiero instalar en mi servidor Linux
→ **Automático:** `install-server.sh` (15 minutos)
→ **Manual:** Lee `DEPLOY_LINUX.md`

### Quiero hacer cambios al código
→ **Desarrollo:** Replit → edita código → `npm run dev`
→ **Producción:** Actualiza servidor → `update.sh`

---

## ⚡ Comandos Útiles

### Desarrollo (Replit)
```bash
npm run dev              # Iniciar servidor
npm run build           # Compilar producción
npm run db:push         # Actualizar base de datos
npm run db:seed         # Datos de prueba
```

### Producción (Servidor Linux)
```bash
pm2 status              # Ver estado
pm2 logs cable-uno-play # Ver logs
pm2 restart cable-uno-play # Reiniciar
/var/www/cable-uno-play/update.sh # Actualizar
```

### Android (Mac)
```bash
./compilar.sh           # Compilar APK
npx cap sync android    # Sincronizar cambios
npx cap open android    # Abrir Android Studio
```

---

## 🆘 Ayuda Rápida

### Error en servidor
```bash
pm2 logs cable-uno-play --err
sudo tail -f /var/log/nginx/cableuno_error.log
```

### Error en APK
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Error en desarrollo
```bash
npm install
npm run build
npm run db:push
```

---

## 📞 Próximos Pasos

1. ✅ **Desarrollo local** → Ya funciona en Replit
2. ✅ **Compilar APK** → Usa `compilar.sh` en Mac
3. ✅ **Deploy servidor** → Usa `install-server.sh` en Linux
4. ✅ **Producción** → App en `https://tu-dominio.com`

**¿Dudas?** Revisa las guías específicas según tu objetivo.
