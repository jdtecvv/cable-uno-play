import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseM3U } from "@/lib/utils/m3u-parser";
import VideoPlayer from "@/components/player/video-player";
import { PlayIcon, TvIcon, SearchIcon, Trash2Icon, DownloadIcon, GridIcon, ListIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [channels, setChannels] = useState<SimpleChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<SimpleChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast } = useToast();

  // Cargar canales guardados al inicio
  useEffect(() => {
    const savedChannels = localStorage.getItem('simple-channels');
    if (savedChannels) {
      try {
        setChannels(JSON.parse(savedChannels));
      } catch (e) {
        console.error("Error loading saved channels:", e);
      }
    }
  }, []);

  const clearChannels = () => {
    setChannels([]);
    setM3uUrl("");
    setUsername("");
    setPassword("");
    localStorage.removeItem('simple-channels');
    toast({
      title: "Limpiado",
      description: "Todos los canales han sido eliminados",
    });
  };

  const loadM3U = async () => {
    if (!m3uUrl) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL de M3U",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use proxy endpoint to avoid CORS issues
      const response = await fetch('/api/proxy/m3u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: m3uUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo cargar la URL");
      }

      const { content } = await response.json();
      const playlist = parseM3U(content);
      
      const simpleChannels: SimpleChannel[] = playlist.items.map(item => ({
        name: item.name,
        url: item.url,
        logo: item.tvg?.logo || undefined,
        group: item.group?.title || undefined,
        // Usar credenciales del M3U (si existen) o las ingresadas manualmente
        username: item.username || username || undefined,
        password: item.password || password || undefined,
      }));

      setChannels(simpleChannels);
      localStorage.setItem('simple-channels', JSON.stringify(simpleChannels));

      toast({
        title: "¡Éxito!",
        description: `${simpleChannels.length} canales cargados`,
      });
    } catch (error) {
      console.error("Error loading M3U:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cargar el M3U",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener categorías únicas
  const categories = ["all", ...Array.from(new Set(channels.map(ch => ch.group).filter(Boolean)))];
  
  const filteredChannels = channels.filter(ch => {
    const matchesSearch = ch.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || ch.group === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (currentChannel) {
    return (
      <div className="h-screen w-screen bg-black">
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
          onClose={() => setCurrentChannel(null)}
          autoplay={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      {/* Header fijo */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-lg border-b border-red-900/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <TvIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Cable Uno Play</h1>
                <p className="text-xs text-gray-400">Modo Simple</p>
              </div>
            </div>
            {channels.length > 0 && (
              <Badge variant="outline" className="border-red-600/50 text-red-500">
                {channels.length} canales
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">{channels.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <TvIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Bienvenido a Cable Uno Play</h2>
            <p className="text-gray-400 mb-8">Carga tu lista M3U para comenzar a ver televisión</p>
          </div>
        )}

        <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-red-900/30 backdrop-blur-sm shadow-2xl mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DownloadIcon className="w-5 h-5 text-red-500" />
              <CardTitle className="text-white">Cargar Lista M3U</CardTitle>
            </div>
            <CardDescription className="text-gray-400">
              Ingresa la URL de tu archivo M3U8 para cargar canales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="http://ejemplo.com/lista.m3u8"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  className="bg-gray-950/80 border-gray-800 text-white focus:border-red-600 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && loadM3U()}
                />
                <Button
                  onClick={loadM3U}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white whitespace-nowrap shadow-lg shadow-red-900/50 transition-all"
                >
                  {isLoading ? "Cargando..." : "Cargar"}
                </Button>
                {channels.length > 0 && (
                  <Button
                    onClick={clearChannels}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-red-950/30 hover:border-red-800 whitespace-nowrap transition-all"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="Usuario (opcional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-950/80 border-gray-800 text-white focus:border-red-600 transition-colors"
                />
                <Input
                  type="password"
                  placeholder="Contraseña (opcional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-950/80 border-gray-800 text-white focus:border-red-600 transition-colors"
                />
              </div>
              
              <p className="text-gray-500 text-xs">
                Solo ingresa credenciales si tu proveedor IPTV lo requiere
              </p>
            </div>
          </CardContent>
        </Card>

        {channels.length > 0 && (
          <>
            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar canal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-950/80 border-gray-800 text-white pl-10 focus:border-red-600 transition-colors"
                  />
                </div>
                <div className="flex gap-1 bg-gray-950/80 border border-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-red-600 hover:bg-red-700" : "text-gray-400 hover:text-white"}
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-red-600 hover:bg-red-700" : "text-gray-400 hover:text-white"}
                  >
                    <ListIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Filtro de categorías */}
              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                  {categories.map((cat) => (
                    <Badge
                      key={cat || "all"}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className={`cursor-pointer whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-red-600 to-red-700 border-red-600 shadow-lg shadow-red-900/50"
                          : "border-gray-700 text-gray-400 hover:border-red-600 hover:text-red-500"
                      }`}
                      onClick={() => setSelectedCategory(cat || "all")}
                    >
                      {cat === "all" ? "Todos" : cat || "Sin categoría"}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
              : "space-y-2"
            }>
              {filteredChannels.map((channel, index) => (
                viewMode === "grid" ? (
                  <Card
                    key={index}
                    className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border-gray-800 hover:border-red-600 hover:shadow-xl hover:shadow-red-900/20 transition-all duration-300 cursor-pointer group overflow-hidden"
                    onClick={() => setCurrentChannel(channel)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <TvIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <PlayIcon className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-semibold truncate group-hover:text-red-500 transition-colors text-sm">
                          {channel.name}
                        </h3>
                        {channel.group && (
                          <p className="text-gray-500 text-xs truncate mt-1">
                            {channel.group}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    key={index}
                    className="bg-gradient-to-r from-gray-900/80 to-gray-950/80 border-gray-800 hover:border-red-600 hover:shadow-lg hover:shadow-red-900/20 transition-all cursor-pointer group"
                    onClick={() => setCurrentChannel(channel)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {channel.logo ? (
                          <img
                            src={channel.logo}
                            alt={channel.name}
                            className="w-14 h-14 object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TvIcon className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate group-hover:text-red-500 transition-colors">
                            {channel.name}
                          </h3>
                          {channel.group && (
                            <p className="text-gray-500 text-sm truncate">
                              {channel.group}
                            </p>
                          )}
                        </div>
                        <PlayIcon className="w-6 h-6 text-gray-600 group-hover:text-red-500 transition-colors flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>

            {filteredChannels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No se encontraron canales con "{searchTerm}"</p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
