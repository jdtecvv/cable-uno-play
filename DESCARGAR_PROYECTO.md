# 📥 Cómo Descargar Cable Uno Play

## 🎯 Opciones para Obtener el Proyecto Completo

### Opción 1: Descargar ZIP desde Replit (MÁS FÁCIL)

1. **En Replit:**
   - Click en el ícono de **tres puntos** `...` (esquina superior derecha)
   - Selecciona **"Download as ZIP"**
   - Se descargará un archivo `cable-uno-play.zip`

2. **Descomprimir:**
   ```bash
   unzip cable-uno-play.zip
   cd cable-uno-play
   ```

3. **Listo!** Ya tienes el proyecto completo

---

### Opción 2: Git Clone (Si está conectado a GitHub)

**Si conectaste Replit a GitHub:**

```bash
git clone https://github.com/TU-USUARIO/cable-uno-play.git
cd cable-uno-play
```

---

### Opción 3: Exportar a GitHub desde Replit

**Recomendado para trabajo colaborativo:**

1. En Replit: Click en **Tools** (herramientas)
2. Click en **Git** (control de versiones)
3. Click en **Create a GitHub repository**
4. Dale un nombre: `cable-uno-play`
5. Click en **Create repository**
6. Ahora puedes clonarlo:

```bash
git clone https://github.com/TU-USUARIO/cable-uno-play.git
```

---

## 📦 Contenido del Proyecto Descargado

```
cable-uno-play/
├── 📱 Android
│   └── android/                    # Proyecto Android Studio listo
│       └── app/build/outputs/apk/  # APKs se generan aquí
│
├── 🌐 Web App
│   ├── client/                     # Frontend React
│   ├── server/                     # Backend Express
│   └── dist/                       # Build de producción
│
├── 📝 Documentación
│   ├── README_ANDROID.md           # Guía completa
│   ├── INSTALACION_APK.md          # Instrucciones APK
│   ├── DESCARGAR_PROYECTO.md       # Este archivo
│   └── replit.md                   # Documentación técnica
│
└── ⚙️ Configuración
    ├── capacitor.config.ts         # Config Capacitor
    ├── package.json                # Dependencias
    └── vite.config.ts              # Config Vite
```

---

## 🚀 Próximos Pasos

### 1️⃣ Instalar Como PWA (Sin Descargar)

**La forma más rápida:**

1. Abre Chrome en Android
2. Visita: `https://tu-replit.replit.dev`
3. Menú → "Agregar a pantalla de inicio"
4. ¡Listo! Ya tienes la app instalada

---

### 2️⃣ Compilar APK en Android Studio

**Después de descargar el proyecto:**

```bash
# 1. Instalar dependencias
npm install

# 2. Build de producción
npm run build

# 3. Sincronizar con Android
npx cap sync android

# 4. Abrir Android Studio
npx cap open android

# 5. Compilar APK
# En Android Studio: Build → Build APK(s)
```

**APK estará en:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### 3️⃣ Ejecutar Localmente (Desarrollo)

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abre en navegador: http://localhost:5000
```

---

## 🔧 Requisitos Para Compilar APK

- ✅ **Node.js 18+** - [Descargar](https://nodejs.org/)
- ✅ **Java JDK 17** - [Descargar](https://adoptium.net/)
- ✅ **Android Studio** - [Descargar](https://developer.android.com/studio)

---

## 🎨 Personalizar la App

### Cambiar Nombre

**1. `capacitor.config.ts`:**
```typescript
appName: 'Mi App IPTV'
```

**2. `client/public/manifest.json`:**
```json
"name": "Mi App IPTV",
"short_name": "Mi App"
```

**3. `client/index.html`:**
```html
<title>Mi App IPTV</title>
```

### Cambiar Colores

**`client/src/index.css`:**
```css
:root {
  --primary: #FF0000;      /* Tu color principal */
  --background: #000000;   /* Tu color de fondo */
}
```

### Cambiar Logo

1. Reemplaza: `client/public/images/cable-uno-logo.png`
2. Genera íconos: https://realfavicongenerator.net/
3. Coloca en: `client/public/images/`

---

## 📞 Ayuda

### Problemas Comunes

**Error al ejecutar `npm install`:**
```bash
# Limpiar cache de npm
npm cache clean --force
npm install
```

**Error `JAVA_HOME not found`:**
```bash
# Verificar Java
java -version

# Configurar JAVA_HOME (Linux/Mac)
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
export PATH=$JAVA_HOME/bin:$PATH
```

**Android Studio no encuentra el SDK:**
```bash
# Crear local.properties en android/
echo "sdk.dir=/Users/TU_USUARIO/Library/Android/sdk" > android/local.properties
```

---

## 📚 Más Información

- **`README_ANDROID.md`** - Guía completa del proyecto
- **`INSTALACION_APK.md`** - Instrucciones detalladas de instalación
- **`replit.md`** - Documentación técnica completa

---

## ✅ Checklist de Descarga

- [ ] Proyecto descargado (ZIP o Git)
- [ ] Node.js instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Build ejecutado (`npm run build`)
- [ ] Android Studio instalado (si vas a compilar APK)
- [ ] Java JDK 17 instalado (si vas a compilar APK)

---

## 🎉 ¡Todo Listo!

Ahora tienes **Cable Uno Play** completo en tu computadora.

**Opciones:**
- ✅ Compilar APK para Android
- ✅ Modificar el código a tu gusto
- ✅ Ejecutar localmente para desarrollo
- ✅ Subir a tu propio servidor

**¡Feliz desarrollo! 🚀**
