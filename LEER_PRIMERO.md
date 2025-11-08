# 📱 CABLE UNO PLAY - APK para Cajas y Tiendas

## 🎯 ¿Necesitas el Archivo APK?

Tienes **2 opciones** para obtener el archivo `.apk`:

---

## ✅ OPCIÓN 1: GitHub Actions (RECOMENDADA - Sin Android Studio)

### APK Compilado Automáticamente en la Nube

**⏱️ Tiempo: 5 minutos setup + 10 minutos compilación**

### Pasos:

1. **Sube este proyecto a GitHub:**
   - En Replit: **Tools** → **Git** → **Create GitHub repository**
   - Nombre: `cable-uno-play`
   - Click **Create**

2. **Espera la compilación automática:**
   - Ve a GitHub → Tu repositorio
   - Click en **Actions** (pestaña superior)
   - Verás un workflow corriendo (círculo amarillo 🟡)
   - Espera ~10 minutos hasta que esté verde ✅

3. **Descarga el APK:**
   - Click en el workflow completado (verde ✅)
   - Scroll down hasta **Artifacts**
   - Click en **cable-uno-play-apk**
   - Se descarga un ZIP → descomprímelo
   - Dentro está: **app-debug.apk**

### ✅ Listo! Ya tienes el APK

**📖 Guía completa:** `COMPILAR_EN_GITHUB.md`

---

## 🔨 OPCIÓN 2: Compilar en Tu Computadora

### Necesitas Android Studio Instalado

**⏱️ Tiempo: 2-3 horas (primera vez)**

### Requisitos:

- ✅ Node.js 18+ - [Descargar](https://nodejs.org/)
- ✅ Java JDK 17 - [Descargar](https://adoptium.net/)
- ✅ Android Studio - [Descargar](https://developer.android.com/studio)

### Pasos Rápidos:

1. **Descargar proyecto:**
   - En Replit: `⋮` → **Download as ZIP**
   - Descomprimir en tu computadora

2. **Ejecutar script automático:**

   **Windows:**
   ```cmd
   compilar.bat
   ```

   **Mac/Linux:**
   ```bash
   bash compilar.sh
   ```

3. **En Android Studio:**
   - Esperar que Gradle sincronice
   - **Build** → **Build APK(s)**
   - Esperar 5-15 minutos

4. **APK estará en:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

### ✅ Listo! Ya tienes el APK

**📖 Guía completa:** `COMPILAR_APK.md`

---

## 📊 Comparación

| | GitHub Actions | Android Studio Local |
|---|---|---|
| **Dificultad** | ⭐ Fácil | ⭐⭐⭐ Difícil |
| **Tiempo setup** | 5 min | 2-3 horas |
| **Requisitos** | Solo GitHub | Node.js + Java + Android Studio |
| **Internet** | ✅ Necesario | Solo para descargar |
| **Espacio disco** | 0 MB | ~10 GB |
| **APK cada commit** | ✅ Automático | ❌ Manual |

---

## 🎯 Mi Recomendación

### Para distribución en cajas/tiendas:

**Usa GitHub Actions** porque:
- ✅ No necesitas instalar Android Studio (ahorra 10 GB)
- ✅ APK siempre actualizado automáticamente
- ✅ Puedes compilar desde cualquier computadora
- ✅ Configuración una sola vez

**Solo usa Android Studio si:**
- ❌ No tienes conexión a internet estable
- ❌ Necesitas compilar APK firmado (release) inmediatamente
- ❌ Ya tienes Android Studio instalado

---

## 🏭 APK para Producción (Firmado)

### Para distribución oficial:

El APK debe estar **firmado** con tu certificado.

**📖 Guías:**
- GitHub Actions: `COMPILAR_EN_GITHUB.md` (sección "APK Firmado")
- Local: `COMPILAR_APK.md` (sección "APK para Producción")

**Diferencia:**
- `app-debug.apk` → Para pruebas
- `app-release.apk` → Para distribución (firmado)

---

## 📦 Archivos del Proyecto

```
cable-uno-play/
│
├── 📱 INSTALACIÓN
│   ├── LEER_PRIMERO.md          ← ESTÁS AQUÍ
│   ├── COMPILAR_APK.md          ← Guía Android Studio
│   ├── COMPILAR_EN_GITHUB.md    ← Guía GitHub Actions
│   ├── compilar.bat             ← Script Windows
│   └── compilar.sh              ← Script Mac/Linux
│
├── 📚 DOCUMENTACIÓN
│   ├── README_ANDROID.md        ← Info completa proyecto
│   ├── INSTALACION_APK.md       ← Cómo instalar APK
│   ├── DESCARGAR_PROYECTO.md    ← Cómo descargar
│   └── replit.md                ← Documentación técnica
│
├── 🤖 AUTOMATIZACIÓN
│   └── .github/workflows/
│       └── build-apk.yml        ← GitHub Actions config
│
└── 📱 PROYECTO ANDROID
    └── android/                 ← Android Studio project
        └── app/build/outputs/apk/ ← APKs aquí
```

---

## 🚀 Inicio Rápido (3 Pasos)

### ¿Quieres el APK YA?

```bash
# 1. Sube a GitHub desde Replit
Tools → Git → Create GitHub repository

# 2. Ve a GitHub
https://github.com/TU_USUARIO/cable-uno-play

# 3. Descarga APK
Actions → Workflow verde ✅ → Artifacts → Descargar
```

**⏱️ Tiempo total: 15 minutos**

---

## ✅ Checklist

Marca lo que ya tienes:

- [ ] Proyecto descargado o en GitHub
- [ ] APK compilado (debug o release)
- [ ] APK probado en dispositivo
- [ ] APK listo para distribuir

---

## 📞 Ayuda

**Problemas comunes:**

1. **"No puedo instalar Android Studio"** → Usa GitHub Actions
2. **"JAVA_HOME not found"** → Ver `COMPILAR_APK.md` sección "Solución de Problemas"
3. **"APK no se genera"** → Verificar logs de Gradle
4. **"GitHub Actions falla"** → Ver logs en Actions → Click en workflow

---

## 🎉 Resultado Final

Después de seguir cualquier opción, tendrás:

📦 **Archivo:** `app-debug.apk` (o `app-release.apk` si firmaste)

📏 **Tamaño:** ~15-25 MB

✅ **Compatible con:**
- Cajas Android TV
- Tablets Android
- Smartphones Android 7.0+
- Fire TV

✅ **Listo para:**
- Instalación directa via USB/ADB
- Distribución a tiendas
- Instalación masiva en cajas

---

## 🔥 TL;DR - Versión Corta

**¿Necesitas APK para cajas y tiendas?**

1. **GitHub** (fácil): Sube proyecto → Actions → Descargar APK
2. **Local** (avanzado): Descargar ZIP → `compilar.bat` → Android Studio

**¿APK firmado para producción?**

Lee `COMPILAR_APK.md` sección "APK para Producción"

---

**¡Listo para distribuir Cable Uno Play! 🚀**
