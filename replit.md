# Cable Uno Play - IPTV Streaming Application

## Descripción del Proyecto
Cable Uno Play es una aplicación de streaming IPTV multiplataforma desarrollada para reproducir contenido de televisión en vivo y bajo demanda. La aplicación está diseñada para funcionar en múltiples dispositivos (TV, tablets, móviles, web) con una interfaz en español y los colores corporativos de Cable Uno (rojo, blanco, negro).

## Características Principales

### Soporte de Protocolos
- ✅ **HTTP y HTTPS**: Soporta ambos protocolos sin restricciones
- ✅ **Streaming HLS**: Reproducción de contenido M3U8 usando HLS.js
- ✅ **Formatos de audio y video**: Todos los formatos conocidos hasta la fecha

### Autenticación Opcional
- ✅ **Usuario y contraseña opcionales**: No obligatorios para links gratuitos
- ✅ **Acceso sin publicidad**: Reproductor limpio sin anuncios ni elementos extra

### Gestión de Metadata
- ✅ **Información opcional**: Omite canales sin metadata
- ✅ **Identificación básica**: Muestra solo nombre y flujo de video/audio cuando no hay información completa
- ✅ **Nombres auto-generados**: Asigna "Canal N" cuando no hay nombre disponible
- ✅ **URLs directas**: Soporta archivos M3U con solo URLs (sin #EXTINF)

### Parser M3U Mejorado
El parser ha sido optimizado para manejar:
- Archivos M3U con o sin encabezado `#EXTM3U`
- URLs directas HTTP/HTTPS sin información de canal (#EXTINF)
- Canales con metadata incompleta o vacía
- Asignación automática de nombres cuando no hay información

## Arquitectura Técnica

### Frontend (React + TypeScript)
- **Framework**: React con Vite
- **Routing**: Wouter
- **Estilos**: Tailwind CSS + shadcn/ui
- **Reproductor**: HLS.js para streaming de video
- **Validación**: Zod para formularios

### Backend (Express + TypeScript)
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Base de datos**: PostgreSQL (Neon)
- **Validación**: Zod schemas compartidos

### Estructura de Archivos Principales
```
client/
  src/
    pages/
      setup.tsx                      # Pantalla de configuración inicial
    lib/
      utils/
        m3u-parser.ts               # Parser M3U mejorado
    components/
      player/
        video-player.tsx            # Reproductor de video HLS
        player-controls.tsx         # Controles del reproductor
    
server/
  routes.ts                         # API routes
  storage.ts                        # Funciones de base de datos

shared/
  schema.ts                         # Schemas compartidos (Drizzle + Zod)

db/
  index.ts                          # Configuración de base de datos
```

## Schema de Base de Datos

### Playlists
- `id`: Serial (auto-increment)
- `name`: Nombre de la playlist
- `url`: URL del archivo M3U (puede estar vacío para archivos subidos, usar `file://` prefix)
- `username`: Opcional - Usuario para autenticación
- `password`: Opcional - Contraseña para autenticación
- `isActive`: Boolean - Playlist activa
- `createdAt`, `updatedAt`: Timestamps

### Channels
- `id`: Serial
- `playlistId`: Referencia a playlist
- `name`: Nombre del canal
- `url`: URL del stream
- `categoryId`: Opcional - Categoría del canal
- `logo`: Opcional - URL del logo
- `epgId`: Opcional - ID para guía de programación
- `isFavorite`: Boolean
- `lastWatched`: Timestamp del último acceso

### Categories
- `id`: Serial
- `name`: Nombre único de categoría

## Cambios Recientes

### Noviembre 6, 2025 - Sistema de Proxy para Streams HTTP

**🎉 SOLUCIÓN COMPLETA PARA MIXED CONTENT Y CORS**

1. **Proxy de Streaming HTTP → HTTPS**:
   - Nuevo endpoint `/api/proxy/stream?url=<encoded_url>` en `server/routes.ts`
   - Intercepta TODOS los requests HTTP de HLS.js usando hook `xhrSetup`
   - Convierte automáticamente streams HTTP a HTTPS para evitar Mixed Content
   - Soporta range requests para seeking en video
   - Maneja correctamente headers (Content-Type, Content-Length, CORS)

2. **HLS.js con xhrSetup Hook**:
   - Configuración de `xhrSetup` en VideoPlayer para interceptar todas las requests
   - Detecta URLs HTTP (manifests, variantes, segmentos) y las redirige al proxy
   - URLs HTTPS se mantienen sin cambios
   - Elimina completamente errores de Mixed Content del navegador

3. **Modo Reproductor Simple**:
   - Nueva página `SimplePlayer` que funciona completamente en el navegador
   - Almacenamiento de canales en localStorage (sin backend)
   - Permite pegar URL de M3U8 y reproducir inmediatamente
   - No requiere configuración de base de datos PostgreSQL

4. **Endpoint Proxy CORS**:
   - Endpoint `/api/proxy/m3u` que evita problemas de CORS
   - Permite cargar archivos M3U8 de servidores externos
   - Funciona con HTTP y HTTPS

5. **Soporte HTTP/HTTPS**:
   - Modificada validación de URLs para aceptar tanto HTTP como HTTPS
   - Actualizado schema de Zod en frontend y backend
   
6. **Autenticación Opcional**:
   - Usuario y contraseña ahora completamente opcionales
   - Nombres de playlist auto-generados si no se proporcionan

7. **Parser M3U Mejorado**:
   - Maneja URLs directas sin metadata (#EXTINF)
   - Asigna nombres automáticos ("Canal 1", "Canal 2", etc.)
   - Soporta archivos sin encabezado #EXTM3U
   - Omite líneas de comentarios irrelevantes

8. **Validación de Archivos**:
   - Schema actualizado para soportar archivos subidos con `file://` prefix
   - Permite URLs vacías o con prefijos `http://`, `https://`, `file://`

## Uso de la Aplicación

### Modo Simple (Sin Base de Datos) - ACTUAL
1. Abre la aplicación en tu navegador
2. Pega la URL de tu archivo M3U8 en el campo de texto (ej: `http://190.61.110.177:2728/CABLEUNO.m3u8`)
3. Haz clic en "Cargar"
4. Navega por los canales y haz clic en uno para reproducir
5. Los canales se guardan en localStorage para la próxima sesión

### Modo Completo (Con Base de Datos) - REQUIERE CONFIGURACIÓN
⚠️ Para usar el modo completo con favoritos, historial, y gestión avanzada:
1. Actualizar DATABASE_URL en Secrets con las credenciales correctas
2. Ejecutar `npm run db:push` para crear las tablas
3. Cambiar App.tsx para usar las rutas completas (Home, LiveTV, etc.)

## Limitaciones Conocidas

### Compatibilidad de Codecs del Navegador
⚠️ **IMPORTANTE**: Los navegadores tienen soporte limitado de codecs comparado con VLC

**VLC vs Navegadores**:
- ✅ **VLC**: Tiene decoders para TODOS los codecs (H.264, H.265/HEVC, MPEG-2, etc.)
- ⚠️ **Navegadores**: Solo soportan H.264, VP8, VP9, AV1 (depende del navegador)

**Problema Común**:
- Algunos streams IPTV usan codecs que VLC reproduce perfectamente pero los navegadores no pueden decodificar
- Error típico: `bufferAddCodecError: Failed to execute 'addSourceBuffer' on 'MediaSource': The type provided (...) is not supported`
- Esto NO es un bug de la aplicación, es una limitación del navegador web

**Soluciones**:
1. Usar streams con codecs compatibles (H.264 principalmente)
2. El servidor IPTV debe proporcionar múltiples variantes con diferentes codecs
3. Para uso avanzado, considerar transcodificación server-side (fuera del alcance de esta app)

## Próximos Pasos
1. ✅ ~~Probar importación con link: `http://190.61.110.177:2728/CABLEUNO.m3u8`~~ - Listo
2. ✅ ~~Resolver errores de Mixed Content con proxy HTTP→HTTPS~~ - Listo
3. Mejorar UI del reproductor simple
4. Agregar soporte para listas de favoritos en localStorage
5. Implementar categorías automáticas desde metadata M3U
6. Agregar mensaje de error amigable cuando el codec no es compatible

## Configuración de Desarrollo

### Variables de Entorno Requeridas
- `DATABASE_URL`: URL de conexión PostgreSQL
- `PGUSER`: Usuario de PostgreSQL
- `PGPASSWORD`: Contraseña de PostgreSQL  
- `PGHOST`: Host de PostgreSQL
- `PGDATABASE`: Nombre de la base de datos

### Comandos Útiles
```bash
npm run dev          # Iniciar servidor de desarrollo
npm run db:push      # Sincronizar schema con base de datos
npm run db:seed      # Poblar base de datos con datos de prueba
```

## Diseño UI/UX
- **Colores**: Rojo (#DC2626), Negro (#000000), Blanco (#FFFFFF), Gris (#1F2937)
- **Logo**: Cable Uno (ubicado en `/images/cable-uno-logo.png`)
- **Idioma**: Español
- **Responsive**: Diseñado para TV, tablets, móviles y web

## Notas de Seguridad
- Las contraseñas de playlist se almacenan como texto plano (solo para desarrollo)
- HLS.js maneja automáticamente el buffering y recuperación de errores
- Validación de URLs tanto en frontend como backend
