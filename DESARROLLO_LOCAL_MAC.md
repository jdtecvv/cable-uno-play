# 🖥️ Desarrollo Local en Mac (sin Base de Datos)

## 📋 INFORMACIÓN IMPORTANTE

Para desarrollo iOS en tu Mac, la app puede correr **SIN base de datos PostgreSQL** porque el **"Modo Simple"** (Simple Player) usa `localStorage` del navegador/app y NO necesita backend.

---

## ✅ QUÉ FUNCIONA SIN BASE DE DATOS

### **Endpoints que SÍ funcionan:**
- ✅ `/api/proxy/m3u` - Proxy para cargar archivos M3U
- ✅ `/api/proxy/stream` - Proxy para streams de video
- ✅ Toda la funcionalidad del **Simple Player**

### **Endpoints que NO funcionan (requieren DB):**
- ❌ `/api/playlists/*` - Gestión de playlists guardadas
- ❌ `/api/channels/*` - Gestión de canales favoritos
- ❌ `/api/categories/*` - Categorías de canales

---

## 🚀 CÓMO INICIAR EL SERVIDOR (SIN DB)

### **Opción 1: Ejecutar directamente**

```bash
cd ~/Desktop/cable-uno-play
npm run dev
```

**Verás este mensaje:**
```
⚠️  Running in development mode WITHOUT database (Simple Player only)
   Only /api/proxy/* endpoints will work
   To use full features, set DATABASE_URL environment variable
[express] serving on port 5000
```

✅ **Esto es NORMAL** - El servidor está funcionando correctamente.

---

### **Opción 2: Con base de datos (opcional)**

Si necesitas probar funcionalidades completas con DB:

```bash
# Configura DATABASE_URL apuntando a la base de datos de Replit
export DATABASE_URL="postgresql://usuario:password@host:5432/database"
npm run dev
```

---

## 📱 DESARROLLO iOS CON SIMULATOR

### **1. Configurar para desarrollo:**

```bash
cd ~/Desktop/cable-uno-play
./config-dev-ios.sh
```

Esto:
- ✅ Detecta tu IP local
- ✅ Configura Capacitor
- ✅ Compila el frontend
- ✅ Sincroniza con iOS

### **2. Iniciar servidor (en otra terminal):**

```bash
cd ~/Desktop/cable-uno-play
npm run dev
```

Espera a ver:
```
[express] serving on port 5000
```

### **3. Abrir en Xcode:**

```bash
open ios/App/App.xcworkspace
```

### **4. Ejecutar en Simulator:**

1. En Xcode: **Product → Clean Build Folder** (Shift + Cmd + K)
2. Selecciona un Simulator (ej: iPhone 17 Pro)
3. Click **▶️ Play**

---

## 🧪 PROBAR LA APP

### **En el Simulator:**

1. **Abre la app** Cable Uno Play
2. **Click** en "Modo Jugador Simple"
3. **Ingresa una URL M3U válida**, ejemplo:
   ```
   http://190.61.110.177:2728/get.php?username=USUARIO&password=PASSWORD&type=m3u_plus&output=ts
   ```
4. **Click** "Cargar"
5. **Resultado:** Debería cargar la lista de canales

---

## ⚠️ ERRORES COMUNES

### **Error: "The string did not match the expected pattern"**

**Causa:** URL M3U incompleta o inválida.

**Solución:** Usa una URL completa:
```
✅ CORRECTO:
http://servidor.com/get.php?username=X&password=Y&type=m3u_plus&output=ts

❌ INCORRECTO:
http://190.61.110.177:2728/CABLI
```

---

### **Error: "Database not available in local development mode"**

**Causa:** Intentaste usar funcionalidades que requieren base de datos.

**Solución:** Solo usa el **Simple Player** que NO necesita DB.

---

### **Error: "Cannot connect to localhost"**

**Causa:** El servidor no está corriendo o la IP no está configurada.

**Solución:**
1. Verifica que `npm run dev` esté corriendo
2. Ejecuta `./config-dev-ios.sh` para detectar tu IP
3. Recompila en Xcode

---

## 🚀 COMPILAR PARA PRODUCCIÓN

**IMPORTANTE:** Antes de generar el IPA final:

```bash
cd ~/Desktop/cable-uno-play
./config-prod-ios.sh
```

Esto:
- ✅ Quita la URL de desarrollo
- ✅ Permite URLs dinámicas HTTP/HTTPS
- ✅ Prepara para distribución

Luego en Xcode:
1. Selecciona **"Any iOS Device (arm64)"**
2. **Product → Archive**
3. **Distribute App**

---

## 📊 ARQUITECTURA SIN BASE DE DATOS

```
┌─────────────────────────────────────────┐
│   iPhone Simulator (iOS)                │
│   ┌───────────────────────────────┐     │
│   │  Cable Uno Play App           │     │
│   │  (Capacitor + React)          │     │
│   │                               │     │
│   │  Simple Player Mode:          │     │
│   │  ✅ localStorage              │     │
│   │  ✅ /api/proxy/m3u            │     │
│   │  ✅ /api/proxy/stream         │     │
│   └───────────┬───────────────────┘     │
└───────────────┼─────────────────────────┘
                │ HTTP
                │
                ▼
┌─────────────────────────────────────────┐
│   Mac Local (http://IP:5000)            │
│   ┌───────────────────────────────┐     │
│   │  Express Server               │     │
│   │  ✅ Proxy endpoints           │     │
│   │  ❌ Database endpoints (503)  │     │
│   └───────────────────────────────┘     │
└─────────────────────────────────────────┘
```

---

## ✅ VERIFICAR QUE TODO FUNCIONA

1. **Servidor arrancado:**
   ```bash
   npm run dev
   ```
   Debe mostrar: `[express] serving on port 5000`

2. **App corriendo en Simulator**

3. **Simple Player funcional** - Puede cargar M3U y reproducir canales

4. **URLs HTTP soportadas** - Acepta `http://` y `https://`

---

## 🔄 VOLVER A MODO DESARROLLO

Si ya compilaste para producción y quieres volver a desarrollo:

```bash
./config-dev-ios.sh
```

---

## 📚 REFERENCIAS

- **Scripts iOS:** `config-dev-ios.sh`, `config-prod-ios.sh`
- **Guía completa:** `DESARROLLO_VS_PRODUCCION_iOS.md`
- **Configuración HTTP:** `CONFIGURAR_HTTP_IOS.md`
