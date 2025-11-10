# 🍎 Compilar APK en Mac - Cable Uno Play

## 📋 Requisitos

### 1. Instalar Homebrew (si no lo tienes)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Instalar Node.js

```bash
# Con Homebrew
brew install node@20

# Verificar
node --version
npm --version
```

### 3. Instalar Java JDK 17

```bash
# Con Homebrew
brew install --cask temurin17

# Verificar
java -version
```

### 4. Instalar Android Studio

**Descargar:** https://developer.android.com/studio/install

1. Descargar **Android Studio para Mac**
2. Abrir el archivo `.dmg`
3. Arrastrar **Android Studio** a Applications
4. Abrir Android Studio
5. Seguir el wizard:
   - Install Type: **Standard**
   - Seleccionar tema
   - Descargar **Android SDK**

---

## ⚙️ Configurar Variables de Entorno

### Editar archivo de configuración shell:

**Si usas zsh (default en Mac):**
```bash
nano ~/.zshrc
```

**Si usas bash:**
```bash
nano ~/.bashrc
```

### Agregar estas líneas:

```bash
# Java
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home

# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Node (si usaste Homebrew)
export PATH="/usr/local/opt/node@20/bin:$PATH"
```

### Guardar y aplicar:

```bash
# Guardar: Ctrl + O, Enter
# Salir: Ctrl + X

# Aplicar cambios
source ~/.zshrc  # o source ~/.bashrc
```

### Verificar configuración:

```bash
echo $JAVA_HOME
echo $ANDROID_HOME
java -version
node --version
```

---

## 📥 Descargar Proyecto

### Opción 1: Desde Replit
1. Click `⋮` → Download as ZIP
2. Guardar en: `~/Downloads/cable-uno-play.zip`
3. Descomprimir:

```bash
cd ~/Downloads
unzip cable-uno-play.zip
cd cable-uno-play
```

### Opción 2: Desde Google Drive
1. Descargar carpeta desde Drive
2. Mover a carpeta deseada

---

## 🚀 Compilar APK

### Script Automático (MÁS FÁCIL):

```bash
# Dar permisos de ejecución
chmod +x compilar.sh

# Ejecutar script
./compilar.sh
```

El script hará todo automáticamente:
- ✅ Instalar dependencias
- ✅ Build de producción
- ✅ Sync con Android
- ✅ Abrir Android Studio

---

### Manual (Paso a Paso):

```bash
# 1. Verificar todo está instalado
node --version
java -version

# 2. Instalar dependencias
npm install

# 3. Build de producción
npm run build

# 4. Sincronizar con Android
npx cap sync android

# 5. Abrir Android Studio
npx cap open android
```

---

## 📱 En Android Studio

### 1. Primera vez - Configurar SDK:

Si Android Studio pide descargar componentes:
- Click en **"Download"** o **"Install"**
- Esperar a que descargue (~2-5 GB)
- Restart Android Studio

### 2. Sincronizar Gradle:

- Esperar que termine la sincronización (barra abajo)
- Primera vez: 10-20 minutos
- Veces siguientes: 1-2 minutos

### 3. Compilar APK:

1. Menú: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Esperar compilación (5-15 minutos primera vez)
3. Cuando termine: Click en **"locate"**

---

## 📂 Ubicación del APK

**Ruta completa:**
```
~/Downloads/cable-uno-play/android/app/build/outputs/apk/debug/app-debug.apk
```

**Abrir en Finder:**
```bash
open android/app/build/outputs/apk/debug/
```

---

## 📱 Instalar APK en Dispositivo Android

### Método 1: ADB (USB)

**1. Habilitar depuración USB en Android:**
- Ajustes → Acerca del teléfono
- Tocar 7 veces "Número de compilación"
- Ajustes → Opciones de desarrollador
- Activar "Depuración USB"

**2. Instalar ADB en Mac:**
```bash
brew install android-platform-tools
```

**3. Conectar teléfono y verificar:**
```bash
adb devices
```

**4. Instalar APK:**
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Método 2: AirDrop / Email / Drive

1. Enviar `app-debug.apk` a tu Android
2. Abrir archivo en el teléfono
3. Permitir "Instalar apps desconocidas"
4. Instalar

---

## 🏭 APK Firmado (Para Producción)

### 1. Generar Keystore:

```bash
keytool -genkey -v -keystore ~/cable-uno-play.keystore \
  -alias cableuno \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Responder:**
- Password: (tu contraseña segura)
- Nombre: Cable Uno
- Organización: Cable Uno
- Ciudad, país, etc.

**IMPORTANTE:** Guardar keystore y contraseña en lugar seguro

### 2. Configurar build.gradle:

Editar: `android/app/build.gradle`

**Agregar ANTES de `android {`:**

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

**Dentro de `android { ... }` agregar:**

```gradle
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
    }
}
```

### 3. Crear keystore.properties:

```bash
nano android/keystore.properties
```

**Contenido:**
```properties
storePassword=TU_PASSWORD
keyPassword=TU_PASSWORD
keyAlias=cableuno
storeFile=../../cable-uno-play.keystore
```

### 4. Compilar APK Release:

```bash
cd android
./gradlew assembleRelease
```

**APK firmado en:**
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Solución de Problemas

### Error: "command not found: npx"

```bash
# Reinstalar Node
brew reinstall node@20

# Agregar a PATH
export PATH="/usr/local/opt/node@20/bin:$PATH"
```

### Error: "JAVA_HOME not set"

```bash
# Encontrar Java
/usr/libexec/java_home -V

# Configurar JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Agregar a ~/.zshrc para permanente
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

### Error: "SDK location not found"

```bash
# Crear local.properties
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

### Error: "Permission denied"

```bash
# Dar permisos a gradlew
chmod +x android/gradlew
```

### Gradle sync failed

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

---

## ✅ Checklist Mac

- [ ] Homebrew instalado
- [ ] Node.js 20 instalado
- [ ] Java JDK 17 instalado
- [ ] Android Studio instalado
- [ ] Variables de entorno configuradas en ~/.zshrc
- [ ] Terminal reiniciado o source aplicado
- [ ] Proyecto descargado y descomprimido
- [ ] npm install sin errores
- [ ] npm run build sin errores
- [ ] npx cap sync android sin errores
- [ ] Android Studio sincronizó Gradle
- [ ] APK compilado exitosamente
- [ ] APK instalado en dispositivo

---

## 📊 Tiempos Estimados (Mac)

| Tarea | Primera Vez | Siguiente |
|-------|-------------|-----------|
| Instalar herramientas | 30-60 min | - |
| npm install | 3-5 min | 1 min |
| npm run build | 30-60 seg | 30 seg |
| Gradle sync | 10-20 min | 1-2 min |
| Build APK | 5-15 min | 2-5 min |
| **TOTAL** | **60-90 min** | **5-10 min** |

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ `app-debug.apk` para pruebas
- ✅ `app-release.apk` para producción (si firmaste)
- ✅ APK instalable en cualquier Android 7.0+

**Siguiente:** Instalar en cajas, distribuir a tiendas, etc.
