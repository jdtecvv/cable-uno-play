# 🔨 COMPILAR APK - Guía Completa Cable Uno Play

## 📋 Requisitos Previos

### 1️⃣ Descargar e Instalar Software

**Node.js 18+:**
- Descargar: https://nodejs.org/
- Verificar instalación: `node --version`

**Java JDK 17:**
- Descargar: https://adoptium.net/
- Descargar el archivo: **OpenJDK 17 (LTS)**
- Verificar instalación: `java -version`

**Android Studio:**
- Descargar: https://developer.android.com/studio
- Durante instalación, seleccionar: **Android SDK, Android SDK Platform, Android Virtual Device**

---

## 📥 Paso 1: Descargar el Proyecto

### Desde Replit:
1. Click en **`...`** (tres puntos arriba a la derecha)
2. **"Download as ZIP"**
3. Descomprimir en tu computadora (ejemplo: `C:\cable-uno-play\`)

---

## ⚙️ Paso 2: Configurar Variables de Entorno

### Windows:

**2.1 - Configurar JAVA_HOME:**
1. Buscar donde instalaste Java (ejemplo: `C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\`)
2. Click derecho en **"Este equipo"** → **Propiedades**
3. **Configuración avanzada del sistema**
4. **Variables de entorno**
5. **Nueva variable de sistema:**
   - Nombre: `JAVA_HOME`
   - Valor: `C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\`

**2.2 - Configurar ANDROID_HOME:**
1. Buscar donde está el SDK de Android (ejemplo: `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk\`)
2. **Nueva variable de sistema:**
   - Nombre: `ANDROID_HOME`
   - Valor: `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk\`

**2.3 - Agregar al PATH:**
- Editar variable `Path`
- Agregar estas líneas:
  ```
  %JAVA_HOME%\bin
  %ANDROID_HOME%\platform-tools
  %ANDROID_HOME%\tools
  ```

**2.4 - Reiniciar computadora** para aplicar cambios

---

### Mac/Linux:

**Agregar al archivo `~/.bashrc` o `~/.zshrc`:**

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$JAVA_HOME/bin
```

**Aplicar cambios:**
```bash
source ~/.bashrc  # o source ~/.zshrc
```

---

## 🚀 Paso 3: Compilar el APK

**Abrir terminal/CMD** en la carpeta del proyecto:

```bash
# 1. Verificar que todo está correcto
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

## 📱 Paso 4: Compilar en Android Studio

### 4.1 - Primera vez (configurar SDK):

Si Android Studio pide descargar componentes:
1. Click en **"Download"** o **"Install"**
2. Esperar a que descargue el SDK necesario
3. Reiniciar Android Studio

### 4.2 - Compilar APK:

1. Esperar a que **Gradle** sincronice (barra de progreso abajo)
2. Menú: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Esperar 5-15 minutos (primera vez es más lento)
4. Cuando termine: **"locate"** o **"Show in Explorer"**

---

## 📂 Ubicación del APK

**El archivo estará en:**

```
cable-uno-play/android/app/build/outputs/apk/debug/app-debug.apk
```

**Tamaño aproximado:** 10-25 MB

---

## 🎯 Paso 5: Probar el APK

### En emulador:
```bash
npx cap run android
```

### En dispositivo físico:

**1. Habilitar modo desarrollador:**
- Ajustes → Acerca del teléfono
- Tocar **7 veces** en "Número de compilación"

**2. Habilitar USB Debugging:**
- Ajustes → Opciones de desarrollador
- Activar **"Depuración USB"**

**3. Conectar con cable USB:**
- Conectar teléfono a PC
- Permitir depuración USB en el teléfono

**4. Instalar APK:**
```bash
# Verificar que el dispositivo está conectado
adb devices

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🏭 APK para Producción (Release)

### Para distribuir en cajas y tiendas:

**1. Generar keystore (solo una vez):**

```bash
keytool -genkey -v -keystore cable-uno-play.keystore -alias cableuno -keyalg RSA -keysize 2048 -validity 10000
```

**Responder las preguntas:**
- Password: (tu contraseña segura)
- Nombre, organización, etc.

**IMPORTANTE:** Guardar el archivo `.keystore` y la contraseña en lugar seguro

**2. Configurar build.gradle:**

Editar: `android/app/build.gradle`

Agregar ANTES de `android {`:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('keystore.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Dentro de `android { ... }` agregar:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**3. Crear archivo keystore.properties:**

En `android/keystore.properties`:

```properties
storePassword=TU_PASSWORD_KEYSTORE
keyPassword=TU_PASSWORD_KEYSTORE
keyAlias=cableuno
storeFile=../cable-uno-play.keystore
```

**4. Compilar APK Release:**

```bash
cd android
./gradlew assembleRelease
```

**APK estará en:**
```
android/app/build/outputs/apk/release/app-release.apk
```

Este APK está **firmado y optimizado** para distribución.

---

## 🔧 Solución de Problemas

### Error: JAVA_HOME not found
```bash
# Verificar que Java está instalado
java -version

# Windows: Agregar a variables de entorno
set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17...

# Mac/Linux:
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

### Error: SDK location not found
Crear archivo `android/local.properties`:

```properties
sdk.dir=C:\\Users\\TU_USUARIO\\AppData\\Local\\Android\\Sdk
```

(En Mac: `sdk.dir=/Users/TU_USUARIO/Library/Android/sdk`)

### Error: Gradle sync failed
```bash
# Limpiar proyecto
cd android
./gradlew clean

# Reintentar build
./gradlew assembleDebug
```

### Error: npm install falla
```bash
# Limpiar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## 📊 Comandos Útiles

```bash
# Ver versión actual del APK
cat android/app/build.gradle | grep versionCode

# Incrementar versión antes de compilar nuevo APK
# Editar android/app/build.gradle:
# versionCode 2
# versionName "1.1"

# Listar dispositivos conectados
adb devices

# Desinstalar APK anterior del dispositivo
adb uninstall com.cableuno.play

# Ver logs de la app en tiempo real
adb logcat | grep CableUno
```

---

## ✅ Checklist de Compilación

- [ ] Node.js instalado y verificado
- [ ] Java JDK 17 instalado y verificado
- [ ] Android Studio instalado
- [ ] Variables de entorno configuradas (JAVA_HOME, ANDROID_HOME)
- [ ] Proyecto descargado y descomprimido
- [ ] `npm install` ejecutado exitosamente
- [ ] `npm run build` ejecutado exitosamente
- [ ] `npx cap sync android` ejecutado exitosamente
- [ ] Android Studio abierto y Gradle sincronizado
- [ ] APK compilado exitosamente
- [ ] APK probado en dispositivo/emulador

---

## 🎉 ¡APK Listo!

Ahora tienes el archivo **`app-debug.apk`** (o **`app-release.apk`**) que puedes:

- ✅ Instalar en cajas Android TV
- ✅ Distribuir a tiendas
- ✅ Instalar via USB/ADB
- ✅ Compartir por WhatsApp/Email
- ✅ Subir a servidor interno

**Tamaño final:** ~15-25 MB

---

## 📞 Soporte

Si tienes problemas:

1. Verificar que todas las herramientas estén instaladas correctamente
2. Revisar la sección "Solución de Problemas"
3. Leer los errores de Gradle en Android Studio
4. Verificar que las variables de entorno estén configuradas

**¡Éxito con tu distribución! 🚀**
