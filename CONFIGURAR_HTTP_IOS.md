# 🔧 Configurar HTTP en iOS - Cable Uno Play

## 📍 UBICACIÓN DEL ARCHIVO

**En tu Mac:**
```
~/Desktop/cable-uno-play/ios/App/App/Info.plist
```

---

## ✏️ OPCIÓN 1: EDITAR CON XCODE (MÁS FÁCIL)

1. **Abre Xcode:**
   ```bash
   cd ~/Desktop/cable-uno-play
   open ios/App/App.xcworkspace
   ```

2. **En Xcode**, en el panel izquierdo (Project Navigator):
   - Click en **App** (carpeta azul)
   - Click en **App** (target - ícono de app)
   - Click en pestaña **Info**

3. **Agregar nueva entrada:**
   - Click derecho en cualquier fila → **Add Row**
   - Escribe: `App Transport Security Settings`
   - Click en la flecha ▶ para expandir
   - Click en el **+** que aparece
   - Selecciona: `Allow Arbitrary Loads`
   - Cambia el valor a **YES**

4. **Resultado esperado:**
   ```
   App Transport Security Settings    Dictionary
      └─ Allow Arbitrary Loads         YES
   ```

---

## ✏️ OPCIÓN 2: EDITAR CON EDITOR DE TEXTO

1. **Abre el archivo:**
   ```bash
   cd ~/Desktop/cable-uno-play
   open -a TextEdit ios/App/App/Info.plist
   ```

2. **Busca el ÚLTIMO `</dict>` del archivo** (casi al final)

3. **ANTES de ese último `</dict>`, agrega:**
   ```xml
   	<key>NSAppTransportSecurity</key>
   	<dict>
   		<key>NSAllowsArbitraryLoads</key>
   		<true/>
   	</dict>
   ```

4. **Ejemplo de cómo debe quedar:**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>CFBundleDevelopmentRegion</key>
       <string>en</string>
       
       <!-- ... más contenido ... -->
       
       <key>NSAppTransportSecurity</key>
       <dict>
           <key>NSAllowsArbitraryLoads</key>
           <true/>
       </dict>
   </dict>
   </plist>
   ```

---

## ✏️ OPCIÓN 3: CON TERMINAL (MÁS RÁPIDO)

```bash
cd ~/Desktop/cable-uno-play

# Agregar automáticamente la configuración
/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" ios/App/App/Info.plist
```

Si ya existe y da error, primero bórrala:
```bash
/usr/libexec/PlistBuddy -c "Delete :NSAppTransportSecurity" ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool true" ios/App/App/Info.plist
```

---

## 🚀 DESPUÉS DE EDITAR

```bash
# 1. Sincronizar
npx cap sync ios

# 2. Abrir Xcode
open ios/App/App.xcworkspace

# 3. En Xcode: Product → Clean Build Folder (Shift + Cmd + K)
# 4. Click ▶️ Play
```

---

## ✅ QUÉ HACE ESTO

Permite que la app iOS cargue URLs **HTTP** (sin SSL), necesario para:
- URLs M3U de servidores locales: `http://190.61.110.177:2728/...`
- Streams de canales que usan HTTP

**IMPORTANTE:** Esto es seguro para una app de uso personal/privado. Apple no lo permite en apps públicas de la App Store por razones de seguridad.

---

## 📱 VERIFICAR QUE FUNCIONÓ

En el Simulator, abre la app y prueba cargar:
```
http://190.61.110.177:2728/get.php?username=TU_USER&password=TU_PASS&type=m3u_plus&output=ts
```

Si carga canales correctamente = ✅ Funcionó!
