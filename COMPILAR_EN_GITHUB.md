# 🤖 Compilar APK Automáticamente con GitHub Actions

## ✨ Ventaja: APK Compilado en la Nube (Sin Android Studio)

Con GitHub Actions, el APK se compila **automáticamente** en los servidores de GitHub cada vez que hagas un commit.

**✅ Ventajas:**
- No necesitas Android Studio instalado
- No necesitas configurar JAVA_HOME ni ANDROID_HOME
- APK se genera automáticamente
- Funciona desde cualquier computadora

---

## 🚀 Configuración (Una Sola Vez)

### Paso 1: Subir Proyecto a GitHub

**Desde Replit:**

1. Click en **Tools** (herramientas izquierda)
2. Click en **Git** 
3. Click en **"Create a GitHub repository"**
4. Nombre: `cable-uno-play`
5. Click en **"Create repository"**

**O desde tu computadora:**

```bash
git init
git add .
git commit -m "Initial commit - Cable Uno Play"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/cable-uno-play.git
git push -u origin main
```

---

### Paso 2: Crear Workflow de GitHub Actions

Crear archivo: `.github/workflows/build-apk.yml`

```yaml
name: Build Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:  # Permite ejecutar manualmente

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4
      
      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: ☕ Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      
      - name: 📦 Install dependencies
        run: npm ci
      
      - name: 🏗️ Build web app
        run: npm run build
      
      - name: 📱 Setup Android SDK
        uses: android-actions/setup-android@v3
      
      - name: 🔄 Sync Capacitor
        run: npx cap sync android
      
      - name: 🔨 Build APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug
      
      - name: 📤 Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: cable-uno-play-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
          retention-days: 30
      
      - name: 🎉 Success
        run: |
          echo "✅ APK compilado exitosamente"
          echo "📂 Descárgalo desde la pestaña 'Actions' de GitHub"
```

---

### Paso 3: Subir el Workflow a GitHub

```bash
# Crear carpeta si no existe
mkdir -p .github/workflows

# El archivo build-apk.yml ya debe existir (lo creamos arriba)

# Agregar y subir
git add .github/workflows/build-apk.yml
git commit -m "Add GitHub Actions build workflow"
git push
```

---

## 📥 Descargar el APK Compilado

### Automáticamente (después de cada commit):

1. Ve a tu repositorio en GitHub
2. Click en **"Actions"** (pestaña superior)
3. Click en el workflow más reciente (verde ✅)
4. Sección **"Artifacts"** al final
5. Click en **"cable-uno-play-apk"** para descargar

**El APK se descarga como ZIP**, descomprímelo para obtener `app-debug.apk`.

---

### Manualmente (cuando quieras):

1. Ve a **Actions** en GitHub
2. Click en **"Build Android APK"** (izquierda)
3. Click en **"Run workflow"** (derecha)
4. **"Run workflow"** en la rama `main`
5. Esperar 5-10 minutos
6. Descargar APK de **Artifacts**

---

## 🏭 Compilar APK Firmado (Release)

Para distribución oficial, necesitas firmar el APK.

### Paso 1: Generar Keystore

**En tu computadora:**

```bash
keytool -genkey -v -keystore cable-uno-play.keystore \
  -alias cableuno \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

**Responder:**
- Password: (contraseña segura)
- Nombre: Cable Uno
- Organización: Cable Uno
- Ciudad, país, etc.

**IMPORTANTE:** Guardar archivo `.keystore` y contraseña en lugar SEGURO.

---

### Paso 2: Convertir Keystore a Base64

```bash
# Linux/Mac
base64 cable-uno-play.keystore > keystore.base64

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("cable-uno-play.keystore")) > keystore.base64
```

---

### Paso 3: Agregar Secrets a GitHub

1. Ve a tu repo en GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Click en **"New repository secret"**

**Agregar estos 4 secrets:**

| Name | Value |
|------|-------|
| `KEYSTORE_BASE64` | (contenido del archivo keystore.base64) |
| `KEYSTORE_PASSWORD` | (tu contraseña del keystore) |
| `KEY_ALIAS` | `cableuno` |
| `KEY_PASSWORD` | (tu contraseña del keystore) |

---

### Paso 4: Actualizar Workflow para Release

Modificar `.github/workflows/build-apk.yml`:

Agregar después del paso "Sync Capacitor":

```yaml
      - name: 🔐 Decode Keystore
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/cable-uno-play.keystore
      
      - name: 🔨 Build Signed APK
        if: github.ref == 'refs/heads/main'
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleRelease
        env:
          KEYSTORE_PATH: cable-uno-play.keystore
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
      
      - name: 📤 Upload Signed APK
        if: github.ref == 'refs/heads/main'
        uses: actions/upload-artifact@v4
        with:
          name: cable-uno-play-release-apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

---

### Paso 5: Configurar build.gradle

Editar `android/app/build.gradle`:

**Agregar al inicio (después de `apply plugin`):**

```gradle
def keystorePropertiesFile = rootProject.file("app/cable-uno-play.keystore")
def keystorePassword = System.getenv("KEYSTORE_PASSWORD") ?: ""
def keyAlias = System.getenv("KEY_ALIAS") ?: "cableuno"
def keyPassword = System.getenv("KEY_PASSWORD") ?: ""
```

**Dentro de `android { }` agregar:**

```gradle
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile keystorePropertiesFile
                storePassword keystorePassword
                keyAlias keyAlias
                keyPassword keyPassword
            }
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

---

## 🎯 APK Debug vs Release

| APK | Uso | Firma |
|-----|-----|-------|
| **app-debug.apk** | Pruebas, desarrollo | No firmado |
| **app-release.apk** | Distribución, producción | Firmado ✅ |

**Para cajas y tiendas:** Usa **app-release.apk** (firmado)

---

## 📊 Ventajas de GitHub Actions

| Característica | Local | GitHub Actions |
|----------------|-------|----------------|
| **Android Studio** | ✅ Requerido | ❌ No necesario |
| **Configuración** | ⏳ Compleja | ✅ Automática |
| **Tiempo setup** | 2-3 horas | 5 minutos |
| **Compilación** | Manual | Automática |
| **APK siempre actualizado** | ❌ Manual | ✅ Automático |

---

## 🔧 Solución de Problemas

### Error: Build failed en GitHub Actions

**Ver logs completos:**
1. Click en el workflow que falló
2. Click en **"Build Android APK"**
3. Ver detalles de cada paso

**Errores comunes:**
- **Gradle error**: Verificar `build.gradle` sintaxis
- **Keystore not found**: Verificar secrets en GitHub
- **Node version**: Cambiar en workflow a versión compatible

### APK no se genera

Verificar en logs:
```
./gradlew assembleDebug
```

Si falla, revisar errores de Gradle.

---

## ✅ Checklist GitHub Actions

- [ ] Proyecto subido a GitHub
- [ ] Archivo `.github/workflows/build-apk.yml` creado
- [ ] Workflow ejecutado exitosamente (verde ✅)
- [ ] APK descargado desde Artifacts
- [ ] APK probado en dispositivo
- [ ] (Opcional) Keystore generado para release
- [ ] (Opcional) Secrets configurados en GitHub
- [ ] (Opcional) APK release compilado y firmado

---

## 🎉 ¡Listo!

Ahora cada vez que hagas `git push`, GitHub Actions:

1. ✅ Compila automáticamente el APK
2. ✅ Lo deja disponible en Artifacts
3. ✅ Puedes descargarlo y distribuirlo

**Sin instalar Android Studio en tu computadora. 🚀**

---

## 📞 Recursos

- GitHub Actions: https://github.com/features/actions
- Documentación Capacitor: https://capacitorjs.com/docs/android
- Firmar APKs: https://developer.android.com/studio/publish/app-signing
