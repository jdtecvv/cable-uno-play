# 📱 Instrucciones Paso a Paso - Cable Uno Play

## 🔽 PASO 1: DESCARGAR CÓDIGO DE REPLIT A TU MAC

### Método A: Descargar ZIP desde Replit
1. En Replit, ve al menú hamburguesa (☰) → "Download as ZIP"
2. Descomprime el archivo en tu Mac
3. Abre Terminal y navega a la carpeta:
   ```bash
   cd ~/Downloads/cable-uno-play  # Ajusta la ruta según donde lo descargaste
   ```

### Método B: Clonar con Git (RECOMENDADO)
```bash
# En tu Mac Terminal:
cd ~/Desktop  # O donde quieras guardar el proyecto
git clone https://github.com/TU_USUARIO/cable-uno-play.git
cd cable-uno-play
```

---

## 📱 PASO 2: COMPILAR APP iOS

```bash
# Estando en el directorio del proyecto en tu Mac:
./config-prod-ios.sh
./compilar-ios.sh

# Esto abrirá Xcode automáticamente
# En Xcode: presiona ▶️ para compilar
```

---

## 🤖 PASO 3: COMPILAR APP ANDROID

```bash
# Estando en el directorio del proyecto en tu Mac:
./compilar.sh

# Esto abrirá Android Studio automáticamente
# En Android Studio: presiona ▶️ para compilar
```

---

## 🖥️ PASO 4: ACTUALIZAR SERVIDOR LINUX

### Primero: Corregir el comando SSH

El puerto se especifica con `-p`, no con `:`:

```bash
# CORRECTO:
ssh root@190.61.110.177 -p 2121

# INCORRECTO (lo que intentaste):
# ssh root@190.61.110.177:2121
```

### Conectar y actualizar:

```bash
# 1. Conectar al servidor
ssh root@190.61.110.177 -p 2121

# 2. Una vez conectado, ir al directorio del proyecto
cd /var/www/cable-uno-play  # Ajusta esta ruta según donde esté instalado

# 3. Actualizar código (si usas Git)
git pull origin main

# O si subes archivos manualmente, primero desde tu Mac:
# scp -P 2121 -r client/public/images/cable-uno-logo.png root@190.61.110.177:/var/www/cable-uno-play/client/public/images/
# scp -P 2121 client/src/pages/simple-player.tsx root@190.61.110.177:/var/www/cable-uno-play/client/src/pages/
# scp -P 2121 client/src/pages/setup.tsx root@190.61.110.177:/var/www/cable-uno-play/client/src/pages/

# 4. Instalar dependencias (si cambiaron)
npm install

# 5. Reiniciar la aplicación con PM2
pm2 restart cable-uno-play

# 6. Ver logs para verificar
pm2 logs cable-uno-play --lines 20

# 7. Ver estado
pm2 status
```

---

## ⚠️ SOLUCIÓN DE PROBLEMAS COMUNES

### "pm2: command not found"
```bash
# Instalar PM2 globalmente
npm install -g pm2
```

### "git: command not found"
```bash
# Instalar Git en el servidor
apt-get update
apt-get install git
```

### No sabes dónde está el proyecto en el servidor
```bash
# Buscar el proyecto
find / -name "cable-uno-play" -type d 2>/dev/null
```

---

## 🎯 RESUMEN RÁPIDO

### PARA iOS/ANDROID (en tu Mac):
```bash
# 1. Descargar el código de Replit
# 2. Abrir Terminal
cd ~/Downloads/cable-uno-play  # Donde descargaste el código

# Para iOS:
./config-prod-ios.sh && ./compilar-ios.sh

# Para Android:
./compilar.sh
```

### PARA SERVIDOR LINUX:
```bash
# Conectar (nota el -p para el puerto)
ssh root@190.61.110.177 -p 2121

# Actualizar
cd /var/www/cable-uno-play  # Ajusta la ruta
git pull
pm2 restart cable-uno-play
```

---

## 📞 ¿NECESITAS AYUDA?

Si no tienes el código en GitHub, puedo ayudarte a:
1. Crear un repositorio Git
2. Subir el código desde Replit
3. Clonarlo en tu Mac y en el servidor

¡Avísame y te ayudo! 🚀
