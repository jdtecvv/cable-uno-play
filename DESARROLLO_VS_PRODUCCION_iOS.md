# 📱 Configuración iOS: Desarrollo vs Producción

## 🎯 OBJETIVO

La app debe soportar **AMBAS** conexiones:
- ✅ **HTTP** para red interna: `http://190.61.110.177:2728/...`
- ✅ **HTTPS** para internet: `https://play.teleunotv.cr`

---

## ⚙️ CONFIGURACIÓN ACTUAL

### ✅ **Ya configurado:**

1. **Info.plist** → Permite HTTP y HTTPS:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
   </dict>
   ```

2. **capacitor.config.ts** → Esquema flexible:
   ```typescript
   server: {
     androidScheme: 'https',
     iosScheme: 'https',
     cleartext: true  // Permite HTTP
   }
   ```

---

## 🛠️ MODOS DE USO

### **MODO 1: DESARROLLO LOCAL (Mac + Simulator)**

**Problema:** El Simulator iOS no puede conectarse a `localhost` del Mac.

**Solución:** Configurar IP local temporal.

#### **Pasos:**

1. **Obtén la IP de tu Mac:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   
   Ejemplo de resultado: `inet 192.168.1.100 netmask...`
   
   Tu IP local es: **192.168.1.100**

2. **Edita `capacitor.config.ts`:**
   ```bash
   cd ~/Desktop/cable-uno-play
   nano capacitor.config.ts
   ```
   
   **Agrega `server.url`:**
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.cableuno.play',
     appName: 'Cable Uno Play',
     webDir: 'dist/public',
     server: {
       url: 'http://192.168.1.100:5000',  // ← TU IP LOCAL
       androidScheme: 'https',
       iosScheme: 'https',
       cleartext: true
     },
     // ... resto de la configuración
   };
   ```

3. **Asegúrate que el servidor esté corriendo en tu Mac:**
   ```bash
   cd ~/Desktop/cable-uno-play
   npm run dev
   ```

4. **Recompila iOS:**
   ```bash
   npm run build
   npx cap sync ios
   open ios/App/App.xcworkspace
   ```

5. **En Xcode:**
   - Product → Clean Build Folder (Shift + Cmd + K)
   - Click ▶️ Play

---

### **MODO 2: PRODUCCIÓN (APK/IPA final)**

**Para distribuir la app**, debes **QUITAR** la configuración de desarrollo.

#### **Pasos:**

1. **Edita `capacitor.config.ts`:**
   ```bash
   cd ~/Desktop/cable-uno-play
   nano capacitor.config.ts
   ```

2. **ELIMINA `server.url`:**
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.cableuno.play',
     appName: 'Cable Uno Play',
     webDir: 'dist/public',
     server: {
       // NO poner url aquí para producción
       androidScheme: 'https',
       iosScheme: 'https',
       cleartext: true
     },
     // ... resto
   };
   ```

3. **Build de producción:**
   ```bash
   npm run build
   npx cap sync ios
   ```

4. **Abrir en Xcode para compilar IPA:**
   ```bash
   open ios/App/App.xcworkspace
   ```
   
   - Product → Archive
   - Distribute App

---

## 🔍 **CÓMO FUNCIONA EN PRODUCCIÓN**

Una vez compilada **sin `server.url`**, la app:

1. ✅ **Carga los archivos** desde el bundle empaquetado
2. ✅ **Acepta URLs HTTP** que el usuario ingrese (gracias a `NSAllowsArbitraryLoads`)
3. ✅ **Acepta URLs HTTPS** normalmente
4. ✅ **El proxy del backend** convierte HTTP → HTTPS automáticamente

**Ejemplo de uso real:**

- Usuario en **red interna** ingresa:
  ```
  http://190.61.110.177:2728/get.php?username=X&password=Y&type=m3u_plus
  ```
  
- Usuario en **internet** ingresa:
  ```
  https://play.teleunotv.cr/api/proxy/m3u
  ```

Ambas funcionan correctamente. ✅

---

## 📝 **SCRIPT RÁPIDO PARA CAMBIAR MODO**

### **Cambiar a Desarrollo:**

```bash
cd ~/Desktop/cable-uno-play

# Obtener tu IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "Tu IP local es: $IP"

# Agregar server.url al config
echo "Configurando para desarrollo local..."
sed -i '' 's|server: {|server: {\n    url: "http://'$IP':5000",|' capacitor.config.ts

# Rebuild
npm run build && npx cap sync ios && open ios/App/App.xcworkspace
```

### **Cambiar a Producción:**

```bash
cd ~/Desktop/cable-uno-play

# Quitar server.url del config
sed -i '' '/url: "http/d' capacitor.config.ts

# Rebuild
npm run build && npx cap sync ios && open ios/App/App.xcworkspace
```

---

## ✅ **RESUMEN**

| Modo | server.url | Uso |
|------|-----------|-----|
| **Desarrollo** | `http://TU_IP:5000` | Probar en Simulator |
| **Producción** | ❌ Sin `url` | APK/IPA final |

**IMPORTANTE:** 
- Siempre **QUITA** `server.url` antes de compilar la versión final para distribuir
- La configuración de `NSAppTransportSecurity` permite ambos protocolos en producción
