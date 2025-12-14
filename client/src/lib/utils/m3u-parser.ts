import { M3UEntry, M3UPlaylist } from '@/lib/types';

/**
 * Extrae credenciales de una URL si están presentes
 * @param url URL que puede contener credenciales en formato http://usuario:contraseña@servidor.com
 * @returns Objeto con URL limpia y credenciales (si existen)
 */
function extractCredentialsFromUrl(url: string): { url: string; username?: string; password?: string } {
  try {
    const urlObj = new URL(url);
    const username = urlObj.username || undefined;
    const password = urlObj.password || undefined;
    
    // Si hay credenciales, crear URL limpia sin ellas
    if (username || password) {
      const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
      return { url: cleanUrl, username, password };
    }
    
    return { url };
  } catch {
    // Si falla el parseo, retornar URL original
    return { url };
  }
}

/**
 * Parsea un archivo M3U y devuelve una estructura de playlist con entradas
 * @param content Contenido del archivo M3U como texto
 * @returns Estructura de playlist con entradas
 */
export function parseM3U(content: string): M3UPlaylist {
  // Dividir el contenido en líneas
  const lines = content.split(/[\r\n]+/).filter(line => line.trim());
  
  // Verificar si es un archivo M3U (puede o no tener #EXTM3U)
  const hasExtM3UHeader = lines[0] && lines[0].includes('#EXTM3U');
  const startIndex = hasExtM3UHeader ? 1 : 0;
  
  // Inicializar la playlist
  const playlist: M3UPlaylist = {
    header: {
      attrs: hasExtM3UHeader ? parseAttributes(lines[0]) : {},
      raw: hasExtM3UHeader ? lines[0] : '',
    },
    items: [],
  };
  
  let currentEntry: Partial<M3UEntry> = {};
  let channelCounter = 1;
  
  // Iterar a través de las líneas
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ignorar líneas vacías y comentarios que no son #EXTINF
    if (!line || (line.startsWith('#') && !line.startsWith('#EXTINF'))) {
      continue;
    }
    
    // Info de un canal (línea que comienza con #EXTINF)
    if (line.startsWith('#EXTINF:')) {
      // If we already have a pending entry (missing URL), push it as is or discard?
      // M3U standard usually has EXTINF then URL. If we have multiple EXTINF in a row, the previous one was likely malformed or missing URL.
      // But we'll just reset for the new one.
      currentEntry = {};
      
      // Some M3Us have the name separated by comma, but the duration might be -1 or 0
      // Format: #EXTINF:-1 tvg-id="..." group-title="...",Channel Name

      // We look for the LAST comma, as the attributes might contain commas in quotes
      const lastCommaIndex = line.lastIndexOf(',');

      if (lastCommaIndex !== -1) {
        const name = line.substring(lastCommaIndex + 1);
        currentEntry.name = name.trim() || `Canal ${channelCounter}`;
        
        // Attributes are everything before the comma, excluding #EXTINF:duration
        const attributesPart = line.substring(0, lastCommaIndex);
        const attributes = parseAttributes(attributesPart);
        
        // Extraer grupo (opcional)
        currentEntry.group = {
          title: attributes['group-title'] || '',
        };
        
        // Extraer info TVG (opcional)
        currentEntry.tvg = {
          id: attributes['tvg-id'] || '',
          name: attributes['tvg-name'] || currentEntry.name,
          logo: attributes['tvg-logo'] || '',
          url: attributes['tvg-url'] || '',
        };
        
        // HTTP headers (opcional)
        currentEntry.http = {
          referrer: attributes['referrer'] || '',
          'user-agent': attributes['user-agent'] || '',
        };
        
        // Timeshift (opcional)
        currentEntry.timeshift = attributes['timeshift'] || '';
        
        // Catchup (opcional)
        if (attributes['catchup'] || attributes['catchup-days']) {
          currentEntry.catchup = {
            type: attributes['catchup'] || '',
            days: attributes['catchup-days'] || '',
            source: attributes['catchup-source'] || '',
          };
        }
      } else {
        // Fallback: no comma found, use the whole line after #EXTINF: as name or just default
        // Try to extract attributes even if comma is missing (rare but possible)
        const attributes = parseAttributes(line);
        currentEntry.name = attributes['tvg-name'] || `Canal ${channelCounter}`;
      }
    } 
    // URL de stream (línea que no comienza con #)
    // ADDED: Support for lines that are just URLs, even if they don't start with http (some M3Us use relative paths or other protocols)
    // But for safety, we'll check for http/https OR if the line looks like a file path/url
    else if (!line.startsWith('#') && line.length > 5) {
      // Extraer credenciales de la URL si existen
      const { url, username, password } = extractCredentialsFromUrl(line);
      
      // Si hay una entrada actual del #EXTINF anterior, asignarle esta URL
      if (Object.keys(currentEntry).length > 0) {
        currentEntry.url = url;
        if (username) currentEntry.username = username;
        if (password) currentEntry.password = password;
        
        if (currentEntry.name) {
          playlist.items.push(currentEntry as M3UEntry);
          channelCounter++;
        }
        currentEntry = {}; // Reset para la próxima entrada
      } else {
        // URL directa sin #EXTINF - crear entrada básica
        const basicEntry: M3UEntry = {
          name: `Canal ${channelCounter}`,
          url,
          username,
          password,
          group: { title: '' },
          tvg: { id: '', name: `Canal ${channelCounter}`, logo: '', url: '' },
          http: { referrer: '', 'user-agent': '' },
          timeshift: '',
        };
        playlist.items.push(basicEntry);
        channelCounter++;
      }
    }
  }
  
  // Si la playlist está vacía, lanzar error
  if (playlist.items.length === 0) {
    throw new Error('No se encontraron canales válidos en el archivo M3U');
  }
  
  return playlist;
}

/**
 * Extrae atributos de una línea de texto con formato key="value"
 * @param line Línea de texto con atributos
 * @returns Objeto con los atributos extraídos
 */
function parseAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  // Intentamos extraer atributos en formato key="value" o key='value'
  const attrRegex = /([a-zA-Z0-9-]+)=["']([^"']*)["']/g;
  let match;
  
  while ((match = attrRegex.exec(line)) !== null) {
    attributes[match[1]] = match[2];
  }
  
  return attributes;
}