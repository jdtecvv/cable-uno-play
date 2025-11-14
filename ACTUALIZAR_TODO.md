# 🚀 Guía Completa: Actualizar Cable Uno Play

## 📋 Resumen de Cambios Realizados
- ✅ Logo de Cable Uno centrado y grande en todas las páginas
- ✅ Texto "CABLE UNO PLAY" con tipografía moderna Inter
- ✅ Diseño profesional y consistente
- ✅ Logo actualizado a la versión oficial de Cable Uno Net

---

## 🖥️ 1. ACTUALIZAR SERVIDOR LINUX (190.61.110.177)

### Opción A: Usando Git (RECOMENDADO)

```bash
# 1. Conectar al servidor
ssh usuario@190.61.110.177

# 2. Ir al directorio del proyecto
cd /ruta/del/proyecto/cable-uno-play

# 3. Guardar cambios locales si los hay (opcional)
git stash

# 4. Descargar últimos cambios
git pull origin main

# 5. Instalar dependencias (si hay cambios en package.json)
npm install

# 6. Reiniciar la aplicación con PM2
pm2 restart cable-uno-play

# 7. Verificar que está corriendo
pm2 status
pm2 logs cable-uno-play --lines 50
```

### Opción B: Subir archivos manualmente (si NO usas Git)

```bash
# Desde tu Mac, comprimir los archivos necesarios
tar -czf cable-uno-play-update.tar.gz \
  client/public/images/cable-uno-logo.png \
  client/src/pages/simple-player.tsx \
  client/src/pages/setup.tsx

# Subir al servidor
scp cable-uno-play-update.tar.gz usuario@190.61.110.177:/tmp/

# En el servidor
ssh usuario@190.61.110.177
cd /ruta/del/proyecto/cable-uno-play
tar -xzf /tmp/cable-uno-play-update.tar.gz
pm2 restart cable-uno-play
```

### ⚠️ IMPORTANTE: Configuración del Servidor

Según tu documentación, el servidor tiene esta configuración:
- **Puerto de la app**: 5000
- **Dominio**: play.teleunotv.cr
- **PM2**: Ejecuta con DATABASE_URL explícito
- **Nginx**: Reverse proxy en puertos 80/443

**Comando correcto para iniciar con PM2:**
```bash
DATABASE_URL="postgresql://..." pm2 start npm --name cable-uno-play -- run dev
```

---

## 📱 2. ACTUALIZAR APP iOS

### Requisitos:
- macOS con Xcode instalado
- Apple Developer Account ($99/año) para publicar en App Store
- Node.js v20 LTS (NO v24)

### Pasos:

```bash
# 1. Asegurarte de estar en el directorio del proyecto
cd /ruta/del/proyecto/cable-uno-play

# 2. Configurar para PRODUCCIÓN (elimina server URL)
./config-prod-ios.sh

# 3. Compilar para iOS
./compilar-ios.sh

# Esto hará:
# - npx cap sync ios
# - Abrir Xcode automáticamente
```

### En Xcode:

1. **Seleccionar destino**: 
   - Para Simulator: iPhone 15 Pro (o el que prefieras)
   - Para dispositivo real: Tu iPhone conectado

2. **Compilar y ejecutar**:
   - Presiona el botón ▶️ (Play) o `Cmd + R`

3. **Para publicar en App Store**:
   - Product → Archive
   - Distribute App → App Store Connect
   - Subir a TestFlight o publicar directamente

### Modo DESARROLLO (para probar en Simulator):

```bash
# Si quieres probar conectándote a localhost:3000
./config-dev-ios.sh
./compilar-ios.sh
```

---

## 🤖 3. ACTUALIZAR APP ANDROID

### Requisitos:
- Android Studio instalado
- Java JDK 17
- Android SDK

### Pasos:

```bash
# 1. Asegurarte de estar en el directorio del proyecto
cd /ruta/del/proyecto/cable-uno-play

# 2. Compilar para Android
./compilar.sh

# Esto hará:
# - npx cap sync android
# - Abrir Android Studio automáticamente
```

### En Android Studio:

1. **Esperar a que Gradle sincronice** (puede tardar unos minutos la primera vez)

2. **Compilar APK de desarrollo**:
   - Build → Build Bundle(s) / APK(s) → Build APK(s)
   - El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Compilar APK de producción (para publicar)**:
   - Build → Generate Signed Bundle / APK
   - Seleccionar "APK"
   - Usar tu keystore (o crear uno nuevo)
   - El APK firmado estará en: `android/app/release/`

4. **Ejecutar en dispositivo/emulador**:
   - Conectar dispositivo Android por USB (activar depuración USB)
   - O iniciar un emulador Android
   - Presionar el botón ▶️ (Run)

---

## ✅ 4. VERIFICAR QUE TODO FUNCIONA

### En el Servidor Linux:
```bash
# Ver logs en tiempo real
pm2 logs cable-uno-play

# Verificar en navegador
curl https://play.teleunotv.cr
```

### En iOS:
- Abrir la app en el Simulator o dispositivo
- Verificar que el logo se ve correctamente
- Probar cargar una lista M3U
- Verificar que los streams funcionan

### En Android:
- Instalar el APK en un dispositivo
- Verificar que el logo se ve correctamente
- Probar cargar una lista M3U
- Verificar que los streams funcionan

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Servidor no inicia:
```bash
# Ver logs de PM2
pm2 logs cable-uno-play --err

# Verificar DATABASE_URL
echo $DATABASE_URL

# Reiniciar Nginx si es necesario
sudo systemctl restart nginx
```

### iOS no compila:
```bash
# Limpiar y reconstruir
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npx cap sync ios
```

### Android Gradle falla:
```bash
# Limpiar build
cd android
./gradlew clean
cd ..
npx cap sync android
```

---

## 📝 NOTAS IMPORTANTES

1. **Base de datos**: El modo Simple Player NO requiere base de datos, todo se guarda en localStorage
2. **Credenciales M3U**: Se almacenan en localStorage del navegador/app
3. **CORS y Mixed Content**: El proxy del servidor maneja esto automáticamente
4. **Puerto del servidor**: 
   - Desarrollo en Mac: 5000
   - Producción en Linux: 5000

---

## 🔄 GitHub Actions (OPCIONAL - Automatización)

Si quieres automatizar las compilaciones, ya tienes workflows en `.github/workflows/`:
- `android.yml` - Compila APK automáticamente en cada push
- Puedes agregar uno similar para iOS

---

## 📞 SOPORTE

Si algo falla:
1. Revisa los logs: `pm2 logs cable-uno-play`
2. Verifica que Node.js es v20: `node --version`
3. Asegúrate que las dependencias están instaladas: `npm install`
4. Consulta `DESARROLLO_LOCAL_MAC.md` y `DESARROLLO_VS_PRODUCCION_iOS.md` para más detalles

---

**¡Listo! Ahora puedes actualizar el servidor y las apps con los nuevos cambios del logo.** 🚀
