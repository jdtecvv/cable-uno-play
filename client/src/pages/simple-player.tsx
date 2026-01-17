import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseM3U } from "@/lib/utils/m3u-parser";
import VideoPlayer from "@/components/player/video-player";
import { TvIcon, SearchIcon, Trash2Icon, DownloadIcon, XIcon, UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ChannelGrid from "@/components/channels/channel-grid";
import CategoryFilter from "@/components/channels/category-filter";
import { ChannelWithCategory } from "@/lib/types";
import { Category } from "@shared/schema";

interface SimpleChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  username?: string;
  password?: string;
}

export default function SimplePlayer() {
  const [m3uUrl, setM3uUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [channels, setChannels] = useState<SimpleChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<SimpleChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [showLoadForm, setShowLoadForm] = useState(false);
  // Transcodificación SIEMPRE activada por defecto (automática para usuarios)
  const [useTranscoding] = useState<boolean>(true);
  const { toast } = useToast();

  const loadM3U = async (urlOverride?: string, nameOverride?: string) => {
    const urlToLoad = (urlOverride || m3uUrl).trim();
    const nameToLoad = (nameOverride || playlistName).trim();
    
    if (!urlToLoad) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL de M3U",
        variant: "destructive",
      });
      return;
    }

    if (!nameToLoad) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la lista",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let simpleChannels: SimpleChannel[] = [];
      let isPlaylist = false;

      // Intentar cargar siempre como playlist primero para inspeccionar contenido
      try {
        const response = await fetch('/api/proxy/m3u', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: urlToLoad }),
        });

        if (response.ok) {
          const { content } = await response.json();

          // Verificar si es un stream HLS (master o media playlist)
          // Si tiene #EXTINF y NO tiene #EXT-X-TARGETDURATION (media) ni #EXT-X-STREAM-INF (master ABR), es probable que sea una lista de canales.
          // Sin embargo, algunas listas de canales M3U son simples.
          // La mejor verificación es ver si parseM3U encuentra múltiples items.

          // Check for stream specific tags that indicate it's NOT a channel list
          const isHLSStream = content.includes('#EXT-X-TARGETDURATION') ||
                              content.includes('#EXT-X-MEDIA-SEQUENCE');
          
          if (!isHLSStream) {
            try {
              const playlist = parseM3U(content);
              if (playlist.items.length > 0) {
                 // Éxito parseando como lista de canales
                 simpleChannels = playlist.items.map(item => ({
                  name: item.name,
                  url: item.url,
                  logo: item.tvg?.logo || undefined,
                  group: item.group?.title || undefined,
                  username: item.username || undefined,
                  password: item.password || undefined,
                }));
                isPlaylist = true;
              }
            } catch (e) {
              // Falló el parsing, tal vez no es una lista válida
              console.warn("No se pudo parsear como lista de canales:", e);
            }
          }
        }
      } catch (proxyError) {
        console.warn("Error intentando fetch via proxy:", proxyError);
      }

      // Si no se detectó como playlist, asumir que es un stream directo
      if (!isPlaylist) {
        simpleChannels = [{
          name: nameToLoad || "Canal Directo",
          url: urlToLoad,
          logo: undefined,
          group: "Directo",
        }];
      }

      setChannels(simpleChannels);
      localStorage.setItem('simple-channels', JSON.stringify(simpleChannels));
      localStorage.setItem('simple-playlist-name', nameToLoad);
      setShowLoadForm(false);
      setSelectedCategoryId(null);

      // Update state in case it was called with overrides
      if (urlOverride) setM3uUrl(urlOverride);
      if (nameOverride) setPlaylistName(nameOverride);

      toast({
        title: "¡Éxito!",
        description: `${simpleChannels.length} canales cargados de "${nameToLoad}"`,
      });
    } catch (error) {
      console.error("Error loading M3U:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar la lista",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar canales guardados al inicio
  useEffect(() => {
    const savedChannels = localStorage.getItem('simple-channels');
    const savedPlaylistName = localStorage.getItem('simple-playlist-name');

    if (savedChannels) {
      try {
        const parsed = JSON.parse(savedChannels);
        if (parsed.length > 0) {
          setChannels(parsed);
          if (savedPlaylistName) {
            setPlaylistName(savedPlaylistName);
          }
          return;
        }
      } catch (e) {
        console.error("Error loading saved channels:", e);
      }
    }

    // Si no hay canales guardados, mostrar el formulario
    setShowLoadForm(true);
  }, []);

  const clearChannels = () => {
    setChannels([]);
    setM3uUrl("");
    setPlaylistName("");
    setShowLoadForm(true);
    setSelectedCategoryId(null);
    localStorage.removeItem('simple-channels');
    localStorage.removeItem('simple-playlist-name');
    toast({
      title: "Lista eliminada",
      description: "Todos los canales han sido eliminados",
    });
  };

  // Memoize mapped channels to avoid recalculation
  const { mappedChannels, categories } = useMemo(() => {
    const categoryMap = new Map<string, Category>();
    const mapped: ChannelWithCategory[] = [];

    channels.forEach((ch, index) => {
      const groupName = ch.group || "Sin categoría";

      let category = categoryMap.get(groupName);
      if (!category) {
        // Create fake category
        category = {
          id: -(categoryMap.size + 1), // Negative ID to avoid conflict with DB
          name: groupName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        categoryMap.set(groupName, category);
      }

      mapped.push({
        channel: {
            id: -(index + 1), // Negative ID based on index
            name: ch.name,
            url: ch.url,
            logo: ch.logo || null,
            playlistId: 0,
            categoryId: category.id,
            epgId: null,
            isFavorite: false,
            lastWatched: null,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        category: category
      });
    });

    return {
        mappedChannels: mapped,
        categories: Array.from(categoryMap.values())
    };
  }, [channels]);

  const filteredChannels = mappedChannels.filter(item => {
    const matchesSearch = item.channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryId === null || item.category?.id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  });

  const handlePlay = (channel: ChannelWithCategory) => {
    const index = Math.abs(channel.channel.id) - 1;
    if (channels[index]) {
      setCurrentChannel(channels[index]);
    }
  };

  if (currentChannel) {
    return (
      <div className="h-full w-full bg-black">
        <VideoPlayer
          channel={{
            id: 0,
            name: currentChannel.name,
            url: currentChannel.url,
            playlistId: 0,
            categoryId: null,
            logo: currentChannel.logo || null,
            epgId: null,
            isFavorite: false,
            lastWatched: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }}
          username={currentChannel.username}
          password={currentChannel.password}
          useTranscoding={useTranscoding}
          onClose={() => setCurrentChannel(null)}
          autoplay={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold uppercase">
              REPRODUCTOR URL
          </h1>
          {playlistName && (
              <p className="text-sm font-medium text-muted-foreground">
                {playlistName}
              </p>
          )}
        </div>
        
        {channels.length > 0 && (
          <div className="flex items-center gap-3">
             <div className="relative w-full md:w-64">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar canal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
             </div>
             <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLoadForm(true)}
              >
                Cargar otra
              </Button>
          </div>
        )}
      </div>

      {/* Link a versión XUI - Solo Clientes */}
      <div className="mb-6">
        <Link href="/xui">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
          >
            <UserIcon className="w-4 h-4 mr-2" />
            <span className="font-semibold">Ir a Clientes Cable</span>
          </Button>
        </Link>
      </div>

      {channels.length === 0 && !showLoadForm && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <TvIcon className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Bienvenido a Cable Uno Play</h2>
          <p className="text-muted-foreground mb-8">Carga tu lista para comenzar a ver televisión</p>
          <Button
            onClick={() => setShowLoadForm(true)}
            size="lg"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Cargar Lista
          </Button>
        </div>
      )}

      {showLoadForm && (
        <Card className="mb-6 max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DownloadIcon className="w-5 h-5 text-primary" />
                <CardTitle>
                  {channels.length > 0 ? "Cargar Nueva Lista" : "Cargar Lista M3U"}
                </CardTitle>
              </div>
              {channels.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoadForm(false)}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
            <CardDescription>
              {channels.length > 0
                ? "Esto reemplazará la lista actual"
                : "Ingresa la información de tu lista IPTV"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Nombre de la lista (ej: Mi IPTV Casa)"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="URL del archivo M3U8"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa la URL de tu archivo M3U o M3U8
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => loadM3U()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "Cargando..." : "Cargar Lista"}
                </Button>
                {channels.length > 0 && (
                  <Button
                    onClick={clearChannels}
                    variant="outline"
                  >
                    <Trash2Icon className="w-4 h-4 mr-2" />
                    Eliminar actual
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {channels.length > 0 && (
        <>
          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
          />

          <ChannelGrid
            channels={filteredChannels}
            onPlay={handlePlay}
            enableFavorites={false}
            emptyMessage={searchTerm ? `No se encontraron canales para "${searchTerm}"` : "No hay canales en esta categoría"}
          />
        </>
      )}

    </div>
  );
}
