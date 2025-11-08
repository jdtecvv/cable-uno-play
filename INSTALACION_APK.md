# 📱 Cable Uno Play - Guía de Instalación

## 🎯 3 Formas de Usar la App en Android

### ✅ Opción 1: PWA - Instalar desde Navegador (RECOMENDADA)

**La más rápida y fácil - Sin necesidad de APK**

#### Pasos para Instalar:

1. **Abre tu navegador Chrome en Android**
   - Visita: `https://[TU-DOMINIO-REPLIT].replit.dev`

2. **Menú del navegador** → "Agregar a pantalla de inicio"
   - O verás un banner automático que dice "Instalar app"

3. **¡Listo!** La app aparecerá en tu pantalla de inicio
   - Se abrirá en pantalla completa (sin barra del navegador)
   - Funciona offline después de la primera carga
   - Actualizaciones automáticas

#### Ventajas de PWA:
- ✅ Instalación instantánea
- ✅ No ocupa tanto espacio como APK
- ✅ Actualizaciones automáticas
- ✅ Funciona igual que una app nativa
- ✅ Compatible con Android 5.0+

---

### 🔧 Opción 2: Compilar APK en tu PC

**Para desarrolladores que quieren personalizar la app**

#### Requisitos:
- Android Studio instalado
- Java JDK 17 o superior
- 8GB RAM mínimo

#### Paso 1: Descargar el Proyecto

```bash
# Opción A: Clonar desde Replit (si tienes Git conectado)
git clone https://github.com/TU-USUARIO/cable-uno-play.git

# Opción B: Descargar ZIP
# Desde Replit: tres puntos (...) → Download as ZIP
```

#### Paso 2: Preparar el Proyecto

```bash
cd cable-uno-play

# Instalar dependencias
npm install

# Hacer build de producción
npm run build

# Sincronizar con Android
npx cap sync android
```

#### Paso 3: Abrir en Android Studio

```bash
# Abrir el proyecto Android
npx cap open android

# O manualmente:
# Android Studio → Open → cable-uno-play/android
```

#### Paso 4: Compilar APK

1. **En Android Studio:**
   - Menu `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`

2. **O desde terminal:**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

3. **Ubicación del APK:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

#### Paso 5: Instalar en tu Android

1. Copia el archivo `app-debug.apk` a tu teléfono
2. Abre el archivo desde tu administrador de archivos
3. Si sale advertencia: **Configuración** → **Instalar apps desconocidas** → Permitir
4. ¡Listo! La app se instalará

---

### 🌐 Opción 3: Publicar en Google Play (Producción)

**Para distribuir la app públicamente**

#### Requisitos:
- Cuenta de desarrollador de Google Play ($25 pago único)
- APK firmado con certificado de producción

#### Pasos:

1. **Generar Keystore (primera vez):**
   ```bash
   keytool -genkey -v -keystore cable-uno.keystore \
     -alias cable-uno -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar Capacitor:**
   Editar `capacitor.config.ts`:
   ```typescript
   android: {
     buildOptions: {
       keystorePath: 'path/to/cable-uno.keystore',
       keystoreAlias: 'cable-uno',
     }
   }
   ```

3. **Compilar APK de Producción:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Subir a Google Play Console:**
   - https://play.google.com/console
   - Crear nueva aplicación
   - Subir APK firmado
   - Llenar metadatos (descripción, capturas, etc.)
   - Enviar para revisión

---

## 📦 Estructura del Proyecto

```
cable-uno-play/
├── client/                  # Frontend React
│   ├── src/
│   │   ├── pages/          # Páginas (simple-player.tsx)
│   │   ├── components/     # Componentes reutilizables
│   │   └── lib/            # Utilidades (m3u-parser, etc.)
│   ├── public/
│   │   ├── manifest.json   # PWA manifest
│   │   └── service-worker.js
│   └── index.html
├── server/                  # Backend Express
│   ├── index.ts            # Servidor principal
│   └── routes.ts           # API endpoints (proxy, etc.)
├── android/                 # Proyecto Android (Capacitor)
│   ├── app/
│   │   └── build/outputs/apk/  # APKs compilados aquí
│   └── gradle/
├── shared/                  # Código compartido
│   └── schema.ts           # Schemas de base de datos
├── capacitor.config.ts     # Configuración Capacitor
└── package.json
```

---

## 🐛 Solución de Problemas

### Error: "App not installed"
- **Solución**: Desinstala cualquier versión anterior primero

### Error: "Parse error"
- **Solución**: El APK está corrupto, vuelve a compilar

### Error: "Java not found"
- **Solución**: Instala Java JDK 17:
  ```bash
  # Ubuntu/Debian
  sudo apt install openjdk-17-jdk
  
  # macOS
  brew install openjdk@17
  
  # Windows
  # Descarga desde: https://adoptium.net/
  ```

### Error: "ANDROID_HOME not set"
- **Solución**: Configura la variable de entorno:
  ```bash
  # Linux/Mac
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  
  # Windows (PowerShell)
  $env:ANDROID_HOME = "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"
  ```

### La app no se conecta al servidor
- **Problema**: El APK usa URLs locales (localhost)
- **Solución**: Antes de compilar, actualiza `client/src/lib/queryClient.ts`:
  ```typescript
  // Cambia esto:
  const API_URL = '';
  
  // Por tu dominio de producción:
  const API_URL = 'https://tu-servidor.com';
  ```

---

## 🎨 Personalización

### Cambiar Colores

Editar `client/src/index.css`:
```css
:root {
  --primary: #DC2626;  /* Rojo Cable Uno */
  --background: #000000;
  /* ... más colores */
}
```

### Cambiar Logo

1. Reemplaza: `client/public/images/cable-uno-logo.png`
2. Genera íconos PWA en: https://realfavicongenerator.net/
3. Coloca en: `client/public/images/icon-192.png` y `icon-512.png`

### Cambiar Nombre de la App

1. `capacitor.config.ts`: Cambia `appName`
2. `client/public/manifest.json`: Cambia `name` y `short_name`
3. `client/index.html`: Cambia `<title>`

---

## 📞 Soporte

¿Problemas con la instalación?
- Revisa los logs en Android Studio
- Verifica que todas las dependencias estén instaladas
- Asegúrate de tener Android SDK 33 o superior

---

## 🚀 Próximos Pasos

Una vez instalada la app:
1. Abre Cable Uno Play
2. Pega tu URL de playlist M3U8
3. O ingresa credenciales de Xtream Codes
4. ¡Disfruta tu contenido IPTV!

---

**Versión Premium desbloqueada con credenciales:**
- Favoritos
- Historial de reproducción  
- EPG (Guía de programación)
- VOD (Películas y Series)
- Catch-Up TV
- Y mucho más...
