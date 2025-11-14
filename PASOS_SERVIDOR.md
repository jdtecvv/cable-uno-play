# 🖥️ PASOS PARA ACTUALIZAR EL SERVIDOR (190.61.110.177)

## PASO 1: Conectarse al servidor

Copia y pega este comando en tu Terminal de Mac:

```bash
ssh root@190.61.110.177 -p 2121
```

Te pedirá la contraseña. Escríbela (no se verá mientras la escribes, es normal).

---

## PASO 2: Buscar dónde está instalado Cable Uno Play

Una vez conectado al servidor, copia y pega estos comandos:

```bash
# Buscar el proyecto
find / -name "cable-uno-play" -type d 2>/dev/null | grep -v node_modules

# O buscar por el archivo package.json
find / -name "package.json" -path "*/cable-uno-play/*" 2>/dev/null
```

**Anota la ruta que aparezca** (por ejemplo: `/var/www/cable-uno-play` o `/home/usuario/cable-uno-play`)

---

## PASO 3: Ir a esa carpeta

Reemplaza `/RUTA/QUE/ENCONTRASTE` con la ruta del paso anterior:

```bash
cd /RUTA/QUE/ENCONTRASTE
```

Por ejemplo:
```bash
cd /var/www/cable-uno-play
```

---

## PASO 4: Verificar que es el proyecto correcto

```bash
# Ver si existe el archivo package.json
ls package.json

# Ver el nombre del proyecto
cat package.json | grep '"name"'
```

Debe decir algo como `"cable-uno-play"` o `"client"`.

---

## PASO 5: Actualizar archivos

### Opción A: Si el servidor tiene Git instalado

```bash
# Ver si hay un repositorio Git
git status

# Si funciona, actualizar:
git pull origin main
```

### Opción B: Si NO tiene Git (subir archivos desde tu Mac)

1. **Primero, desconéctate del servidor** (escribe `exit`)

2. **En tu Mac**, necesitas descargar el código de Replit:
   - En Replit, menú (☰) → "Download as ZIP"
   - Descomprime en tu Mac (por ejemplo en `~/Downloads/cable-uno-play`)

3. **Luego sube los archivos** (reemplaza `/var/www/cable-uno-play` con la ruta que encontraste):

```bash
# Subir logo
scp -P 2121 ~/Downloads/cable-uno-play/client/public/images/cable-uno-logo.png \
  root@190.61.110.177:/var/www/cable-uno-play/client/public/images/

# Subir página simple-player
scp -P 2121 ~/Downloads/cable-uno-play/client/src/pages/simple-player.tsx \
  root@190.61.110.177:/var/www/cable-uno-play/client/src/pages/

# Subir página setup
scp -P 2121 ~/Downloads/cable-uno-play/client/src/pages/setup.tsx \
  root@190.61.110.177:/var/www/cable-uno-play/client/src/pages/
```

4. **Vuelve a conectarte al servidor**:
```bash
ssh root@190.61.110.177 -p 2121
cd /var/www/cable-uno-play  # O la ruta que encontraste
```

---

## PASO 6: Reiniciar la aplicación

```bash
# Verificar si PM2 está instalado
pm2 status

# Si PM2 funciona, reiniciar:
pm2 restart cable-uno-play

# Ver logs:
pm2 logs cable-uno-play --lines 20
```

### Si PM2 NO está instalado:

```bash
# Buscar el proceso de Node.js
ps aux | grep node

# Detener el proceso (reemplaza XXXX con el PID que aparezca)
kill XXXX

# Iniciar nuevamente (ajusta el comando según cómo esté configurado)
npm run dev &
```

---

## PASO 7: Verificar

Abre en tu navegador: **https://play.teleunotv.cr**

Deberías ver el logo actualizado de Cable Uno.

---

## ❓ SI ALGO FALLA

**Dime en qué paso estás y qué error te aparece.** Te ayudaré específicamente con ese paso.
