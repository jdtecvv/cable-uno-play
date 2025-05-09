import { M3UEntry, M3UPlaylist } from '@/lib/types';

/**
 * Parsea un archivo M3U y devuelve una estructura de playlist con entradas
 * @param content Contenido del archivo M3U como texto
 * @returns Estructura de playlist con entradas
 */
export function parseM3U(content: string): M3UPlaylist {
  // Dividir el contenido en líneas
  const lines = content.split(/[\r\n]+/).filter(Boolean);
  
  // Verificar si es un archivo M3U
  if (!lines[0].includes('#EXTM3U')) {
    throw new Error('El archivo no es un formato M3U válido');
  }
  
  // Inicializar la playlist
  const playlist: M3UPlaylist = {
    header: {
      attrs: parseAttributes(lines[0]),
      raw: lines[0],
    },
    items: [],
  };
  
  let currentEntry: Partial<M3UEntry> = {};
  
  // Iterar a través de las líneas
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ignorar líneas vacías
    if (!line) continue;
    
    // Info de un canal (línea que comienza con #EXTINF)
    if (line.startsWith('#EXTINF:')) {
      currentEntry = {}; // Reset current entry
      
      const infoMatch = line.match(/#EXTINF:(.*?),(.*)/);
      if (infoMatch) {
        const [, attributesStr, name] = infoMatch;
        currentEntry.name = name.trim();
        
        // Parse attributes like group-title, tvg-id, etc.
        const attributes = parseAttributes(line);
        
        // Extraer grupo
        currentEntry.group = {
          title: attributes['group-title'] || '',
        };
        
        // Extraer info TVG
        currentEntry.tvg = {
          id: attributes['tvg-id'] || '',
          name: attributes['tvg-name'] || name.trim(),
          logo: attributes['tvg-logo'] || '',
          url: attributes['tvg-url'] || '',
        };
        
        // HTTP headers
        currentEntry.http = {
          referrer: attributes['referrer'] || '',
          'user-agent': attributes['user-agent'] || '',
        };
        
        // Timeshift
        currentEntry.timeshift = attributes['timeshift'] || '';
        
        // Catchup
        if (attributes['catchup'] || attributes['catchup-days']) {
          currentEntry.catchup = {
            type: attributes['catchup'] || '',
            days: attributes['catchup-days'] || '',
            source: attributes['catchup-source'] || '',
          };
        }
      }
    } 
    // URL de stream (línea que no comienza con #)
    else if (!line.startsWith('#')) {
      if (Object.keys(currentEntry).length > 0) {
        currentEntry.url = line;
        // Añadir entrada solo si tiene URL y nombre
        if (currentEntry.url && currentEntry.name) {
          playlist.items.push(currentEntry as M3UEntry);
        }
        currentEntry = {}; // Reset para la próxima entrada
      }
    }
    // Otras líneas que comienzan con # son metadatos
    else if (line.startsWith('#')) {
      // Si el metadata pertenece a una entrada existente, guardarlo
      // Aquí podríamos añadir parsing para otros metadatos específicos
    }
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