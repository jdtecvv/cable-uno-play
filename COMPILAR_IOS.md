# 🍎 Compilar App para iOS - Cable Uno Play

## 📋 Requisitos Previos

### ✅ Necesitas:
1. **Mac** (MacBook, iMac, Mac Mini)
2. **macOS 13+** (Ventura o superior)
3. **Xcode 15+** (gratis en App Store)
4. **Apple Developer Account** ($99/año para publicar en App Store)
5. **Node.js 20+** instalado

---

## 🚀 Instalación Rápida

### 1. Instalar Xcode

```bash
# Descargar desde App Store
# O instalar command line tools:
xcode-select --install

# Aceptar licencia
sudo xcodebuild -license accept
```

### 2. Instalar Herramientas

```bash
# Instalar Homebrew (si no lo tienes)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Node.js
brew install node@20

# Verificar
node --version
npm --version
```

---

## 📱 Configurar Proyecto iOS

### Opción 1: Script Automático (RECOMENDADO)

```bash
# Desde la carpeta del proyecto
chmod +x compilar-ios.sh
./compilar-ios.sh
```

### Opción 2: Manual

```bash
# 1. Instalar dependencias del proyecto
npm install

# 2. Instalar Capacitor iOS
npm install @capacitor/ios

# 3. Build de producción
npm run build

# 4. Agregar plataforma iOS
npx cap add ios

# 5. Sincronizar código
npx cap sync ios

# 6. Abrir Xcode
npx cap open ios
```

---

## 🔧 Configurar en Xcode

### Primera Vez:

1. **Abrir el proyecto**
   - Xcode se abrirá automáticamente
   - Esperar a que indexe el proyecto (1-5 min)

2. **Configurar Bundle ID**
   - Click en el proyecto (arriba a la izquierda)
   - Pestaña "Signing & Capabilities"
   - Bundle Identifier: `com.cableuno.play`

3. **Configurar Team**
   - En "Team": Seleccionar tu Apple Developer Account
   - Si no aparece: Click "Add Account..."
   - Iniciar sesión con tu Apple ID

4. **Configurar Dispositivo/Simulador**
   - Arriba en la barra: Seleccionar dispositivo
   - **Simulador**: Cualquier iPhone (para probar)
   - **Dispositivo físico**: Conectar iPhone/iPad por USB

---

## 📱 Probar en Simulador

```bash
# Desde terminal
npx cap run ios

# O en Xcode:
# 1. Seleccionar simulador (ej: iPhone 15 Pro)
# 2. Click en ▶️ (Play) o Cmd+R
# 3. Esperar a que compile (2-5 min primera vez)
```

---

## 📱 Probar en Dispositivo Real

### 1. Conectar iPhone/iPad

1. Conectar con cable USB
2. En iPhone: "Confiar en este ordenador"
3. En Xcode: Seleccionar tu dispositivo arriba

### 2. Configurar Firma

1. **Signing & Capabilities**
2. **Automatically manage signing**: ✅ Activado
3. **Team**: Tu Apple Developer Account
4. **Provisioning Profile**: Automatic

### 3. Compilar e Instalar

1. Click ▶️ (Play) en Xcode
2. Primera vez: Pedir permisos en iPhone
3. **iPhone** → Ajustes → General → VPN y gestión de dispositivos
4. Confiar en el desarrollador
5. Volver a la app y abrirla

---

## 🏪 Publicar en App Store

### 1. Preparar Configuración

**Archivo: `ios/App/App/Info.plist`**

Verificar permisos necesarios:

```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Cable Uno Play necesita acceso a tus fotos para guardar capturas.</string>

<key>NSCameraUsageDescription</key>
<string>Cable Uno Play necesita acceso a la cámara para escanear códigos QR.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Cable Uno Play necesita acceso al micrófono para reproducir audio.</string>
```

### 2. Configurar App Store Connect

1. Ir a: https://appstoreconnect.apple.com
2. **Mis Apps** → **+** → **Nueva App**
3. Completar información:
   - **Nombre**: Cable Uno Play
   - **Idioma principal**: Español
   - **Bundle ID**: com.cableuno.play
   - **SKU**: cableuno-play-001

### 3. Crear Archivo para App Store

En Xcode:

1. **Product** → **Archive**
2. Esperar compilación (5-15 min)
3. Cuando termine: Click **Distribute App**
4. Seleccionar: **App Store Connect**
5. **Upload**
6. Esperar validación (10-30 min)

### 4. Completar Información en App Store Connect

**Información requerida:**

- **Capturas de pantalla**: 
  - iPhone 6.7" (al menos 2)
  - iPhone 5.5" (al menos 2)
  - iPad Pro 12.9" (recomendado)

- **Descripción**:
```
Cable Uno Play es tu plataforma de streaming IPTV premium. Disfruta de televisión en vivo, contenido on-demand y tus canales favoritos en alta calidad.

Características:
• Streaming en vivo HD
• Interfaz intuitiva en español
• Soporte para listas M3U
• Sin publicidad
• Múltiples dispositivos
```

- **Palabras clave**: `iptv, streaming, television, cable, tv`
- **URL de soporte**: `https://play.teleunotv.cr`
- **URL de privacidad**: `https://play.teleunotv.cr/privacy`
- **Categoría**: Entretenimiento
- **Clasificación**: 4+

### 5. Enviar a Revisión

1. Completar toda la información
2. Agregar capturas de pantalla
3. Click **Enviar para revisión**
4. **Tiempo de revisión**: 24-48 horas

---

## 🔐 Certificados y Provisioning Profiles

### Automático (Recomendado para empezar):

Xcode maneja todo automáticamente si:
- ✅ Tienes Apple Developer Account activo
- ✅ "Automatically manage signing" está activado
- ✅ Estás conectado con tu Apple ID en Xcode

### Manual (Para control avanzado):

1. **Apple Developer Portal**: https://developer.apple.com
2. **Certificates, Identifiers & Profiles**
3. Crear:
   - **App ID**: com.cableuno.play
   - **Certificate**: iOS Distribution
   - **Provisioning Profile**: App Store Distribution

---

## 📊 Iconos y Splash Screen

### Iconos Requeridos:

Ubicación: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

**Tamaños necesarios:**
- 1024x1024 (App Store)
- 180x180 (iPhone)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 120x120 (iPhone)
- 87x87 (iPhone notificaciones)
- 80x80 (iPad notificaciones)
- 76x76 (iPad)
- 60x60 (iPhone notificaciones)
- 58x58 (iPhone Spotlight)
- 40x40 (Spotlight)
- 29x29 (Settings)
- 20x20 (Notificaciones)

**Herramienta recomendada**: https://www.appicon.co

1. Subir logo 1024x1024
2. Descargar paquete iOS
3. Copiar archivos a `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Splash Screen:

Ubicación: `ios/App/App/Assets.xcassets/Splash.imageset/`

Crear imagen 2732x2732 con:
- Fondo: Color corporativo Cable Uno
- Logo centrado
- Nombre "Cable Uno Play"

---

## 🔧 Solución de Problemas

### Error: "No signing certificate found"

```bash
# En Xcode:
# 1. Preferences → Accounts
# 2. Click "+" → Add Apple ID
# 3. Iniciar sesión
# 4. Download Manual Profiles
```

### Error: "Provisioning profile doesn't include signing certificate"

```bash
# En Xcode:
# Signing & Capabilities → Automatically manage signing
# Desactivar y volver a activar
```

### Error: "The bundle identifier is invalid"

```bash
# Verificar en capacitor.config.ts:
# appId: 'com.cableuno.play'

# En Xcode:
# Verificar Bundle Identifier coincide
```

### Error: "Build failed with module not found"

```bash
# Limpiar build
cd ios/App
xcodebuild clean
cd ../..
npx cap sync ios
```

### Simulador no inicia

```bash
# Reiniciar simulador
killall Simulator

# Abrir Xcode → Window → Devices and Simulators
# Borrar y recrear simulador
```

---

## 📱 Capturas de Pantalla para App Store

### Herramientas:

**1. Desde Simulador:**
```bash
# Cmd+S en simulador
# Guarda en ~/Desktop
```

**2. Desde Dispositivo Real:**
- iPhone: Volumen + Botón lateral
- Enviar a Mac por AirDrop

**3. Herramientas de diseño:**
- **Figma**: Crear mockups profesionales
- **Sketch**: Diseño de interfaces
- **Screenshots.pro**: Plantillas App Store

### Dispositivos requeridos:

1. **iPhone 6.7"** (iPhone 15 Pro Max, 14 Pro Max)
   - Resolución: 1290 x 2796
   - Mínimo: 2 capturas

2. **iPhone 5.5"** (iPhone 8 Plus, 7 Plus)
   - Resolución: 1242 x 2208
   - Mínimo: 2 capturas

3. **iPad Pro 12.9"** (opcional pero recomendado)
   - Resolución: 2048 x 2732
   - Mínimo: 2 capturas

---

## ✅ Checklist Pre-Publicación

- [ ] App funciona en simulador
- [ ] App funciona en dispositivo real
- [ ] Todos los iconos están configurados (1024x1024 principalmente)
- [ ] Splash screen configurado
- [ ] Bundle ID correcto: `com.cableuno.play`
- [ ] Version y Build Number actualizados
- [ ] Permisos en Info.plist configurados
- [ ] Apple Developer Account activo ($99/año)
- [ ] App Store Connect configurado
- [ ] Capturas de pantalla tomadas (2+ por dispositivo)
- [ ] Descripción y keywords listos
- [ ] URL de privacidad y soporte funcionando
- [ ] Archive compilado exitosamente
- [ ] App subida a App Store Connect
- [ ] Información completa en App Store Connect
- [ ] App enviada a revisión

---

## 📊 Tiempos Estimados

| Tarea | Primera Vez | Siguiente |
|-------|-------------|-----------|
| Instalar Xcode | 60-90 min | - |
| Configurar proyecto | 10-15 min | 2 min |
| Build en simulador | 3-5 min | 1-2 min |
| Build en dispositivo | 5-10 min | 2-3 min |
| Archive para App Store | 10-20 min | 5-10 min |
| Configurar App Store Connect | 30-60 min | - |
| Revisión de Apple | 24-48 horas | 24-48 horas |
| **TOTAL (primera publicación)** | **2-4 horas + revisión** | **30 min + revisión** |

---

## 🎯 Diferencias iOS vs Android

| Aspecto | iOS | Android |
|---------|-----|---------|
| IDE | Xcode (solo Mac) | Android Studio (Win/Mac/Linux) |
| Firma | Automática con Apple ID | Keystore manual |
| Publicación | App Store ($99/año) | Google Play ($25 única vez) |
| Revisión | 24-48 horas | 1-7 días |
| Requisitos | Más estrictos | Más flexibles |
| Distribución | Solo App Store* | APK directo + Play Store |

*TestFlight permite beta testing sin publicar

---

## 🚀 Siguiente Paso

Una vez configurado:

```bash
# Desarrollo rápido:
npm run build && npx cap sync ios && npx cap open ios

# O usar el script:
./compilar-ios.sh
```

---

## 📞 Recursos Útiles

- **Apple Developer**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com
- **Capacitor Docs iOS**: https://capacitorjs.com/docs/ios
- **Xcode Download**: https://developer.apple.com/xcode/
- **Human Interface Guidelines**: https://developer.apple.com/design/human-interface-guidelines/

---

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Compilar para iOS
- ✅ Probar en simulador
- ✅ Probar en iPhone/iPad real
- ✅ Publicar en App Store

**¡Cable Uno Play estará disponible para millones de usuarios de iPhone y iPad!** 📱✨
