import { M3UEntry, M3UPlaylist } from '@/lib/types';

/**
 * Extrae credenciales de una URL si están presentes
 * @param url URL que puede contener credenciales en formato http://usuario:contraseña@servidor.com
 * @returns Objeto con URL limpia y credenciales (si existen)
 */
function extractCredentialsFromUrl(url: string): { url: string; username?: string; password?: string } {
  try {
    // Basic check to see if we might have credentials
    if (!url.includes('@')) return { url };

    // Try to parse with URL object
    try {
        const urlObj = new URL(url);
        const username = urlObj.username || undefined;
        const password = urlObj.password || undefined;

        // Si hay credenciales, crear URL limpia sin ellas
        if (username || password) {
          // Reconstruct URL without credentials
          urlObj.username = '';
          urlObj.password = '';
          return { url: urlObj.toString(), username, password };
        }
    } catch (e) {
        // If URL constructor fails (e.g. some complex protocols), fall back to regex
        const match = url.match(/^(https?:\/\/)([^:@]+):([^@]+)@(.*)$/);
        if (match) {
            return {
                url: `${match[1]}${match[4]}`,
                username: match[2],
                password: match[3]
            };
        }
    }
    
    return { url };
  } catch {
    // Si falla todo, retornar URL original
    return { url };
  }
}

/**
 * Parsea un archivo M3U y devuelve una estructura de playlist con entradas
 * @param content Contenido del archivo M3U como texto
 * @returns Estructura de playlist con entradas
 */
export function parseM3U(content: string): M3UPlaylist {
  // Dividir el contenido en líneas, manejando diferentes terminadores de línea
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  // Verificar si es un archivo M3U (puede o no tener #EXTM3U)
  const hasExtM3UHeader = lines.length > 0 && lines[0].includes('#EXTM3U');
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
    
    // Ignorar líneas vacías
    if (!line) continue;

    // Procesar metadatos (#EXTINF)
    if (line.startsWith('#EXTINF:')) {
      currentEntry = {}; // Reset current entry
      
      // Robust Parsing Strategy:
      // 1. Split by comma, but respect quotes to avoid splitting attributes incorrectly
      // The format is typically: #EXTINF:<duration> <attributes>,<title>

      // Remove #EXTINF: prefix
      const content = line.substring(8);

      // Find the separator comma (the one that separates metadata from title)
      // It should be the first comma that is NOT inside quotes
      let commaIndex = -1;
      let inQuote = false;

      for (let j = 0; j < content.length; j++) {
        if (content[j] === '"') inQuote = !inQuote;
        if (content[j] === ',' && !inQuote) {
          commaIndex = j;
          break;
        }
      }
      
      let metadataPart = '';
      let titlePart = '';

      if (commaIndex !== -1) {
        metadataPart = content.substring(0, commaIndex).trim();
        titlePart = content.substring(commaIndex + 1).trim();
      } else {
        // Fallback: If no comma found (weird), assume all is metadata or all is title?
        // Usually assume remaining is title if no attributes, or just metadata.
        // Let's assume strict format violation, try to parse what we can.
        metadataPart = content;
      }

      // Parse attributes from the metadata part
      const attributes = parseAttributes(metadataPart);

      // Extract name from title part (or fallback to tvg-name)
      // Sometimes title contains " - ", clean it if needed? No, keep it raw.
      currentEntry.name = titlePart || attributes['tvg-name'] || `Canal ${channelCounter}`;

      // Extraer grupo
      currentEntry.group = {
        title: attributes['group-title'] || '',
      };

      // Extraer info TVG
      currentEntry.tvg = {
        id: attributes['tvg-id'] || '',
        name: attributes['tvg-name'] || currentEntry.name,
        logo: attributes['tvg-logo'] || '',
        url: attributes['tvg-url'] || '',
      };

      // Otros atributos comunes
      if (attributes['user-agent']) {
        currentEntry.http = { ...currentEntry.http, 'user-agent': attributes['user-agent'] };
      }
      if (attributes['referrer']) {
        currentEntry.http = { ...currentEntry.http, referrer: attributes['referrer'] };
      }

    }
    // Procesar URL (línea que no empieza con #)
    else if (!line.startsWith('#')) {
       // Validate URL basic structure
       if (line.includes('://') || line.startsWith('http')) {
          const { url, username, password } = extractCredentialsFromUrl(line);

          // Populate entry
          const entry: M3UEntry = {
            name: currentEntry.name || `Canal ${channelCounter}`,
            url: url,
            group: currentEntry.group || { title: 'General' },
            tvg: currentEntry.tvg || { id: '', name: '', logo: '', url: '' },
            http: currentEntry.http || { referrer: '', 'user-agent': '' },
            username: username || currentEntry.username,
            password: password || currentEntry.password,
            timeshift: currentEntry.timeshift || '',
            catchup: currentEntry.catchup
          };

          playlist.items.push(entry);
          channelCounter++;

          // Reset current entry for next block
          currentEntry = {};
       }
    }
  }
  
  if (playlist.items.length === 0) {
     // If no #EXTINF found but we have URLs, try to construct from raw URLs?
     // Or just throw error.
     // Let's try to be lenient: if we saw URLs but no #EXTINF, we might have skipped them.
     // But the loop above handles URLs even if currentEntry is empty (it creates a default one).

     // So if items is empty, it really means no URLs were found.
     throw new Error('No se encontraron canales válidos.');
  }
  
  return playlist;
}

/**
 * Extrae atributos de una línea de texto con formato key="value" o key=value
 * @param line Línea de texto con atributos
 * @returns Objeto con los atributos extraídos
 */
function parseAttributes(line: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  
  // Regex to match key="value", key='value', or key=value
  // Also matches simple flags or -1 duration
  // Use a state-machine approach or a complex regex?
  // Regex for key="value"
  const attrRegex = /([a-zA-Z0-9-_\.]+)=("([^"]*)"|'([^']*)'|([^, ]+))/g;
  
  let match;
  while ((match = attrRegex.exec(line)) !== null) {
    const key = match[1];
    const value = match[3] || match[4] || match[5]; // Group 3 is double quote, 4 is single, 5 is unquoted
    if (key && value) {
        attributes[key] = value;
    }
  }
  
  return attributes;
}
