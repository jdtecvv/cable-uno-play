import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseM3U } from "@/lib/utils/m3u-parser";
import VideoPlayer from "@/components/player/video-player";
import { PlayIcon, TvIcon, SearchIcon, Trash2Icon, ServerIcon, GridIcon, ListIcon, XIcon, KeyIcon, UserIcon, WifiIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

interface XUIChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  username?: string;
  password?: string;
}

interface XUICredentials {
  server: string;
  port: string;
  username: string;
  password: string;
  playlistName: string;
}

export default function XUIPlayer() {
  const [credentials, setCredentials] = useState<XUICredentials>({
    server: "",
    port: "",
    username: "",
    password: "",
    playlistName: "",
  });
  const [channels, setChannels] = useState<XUIChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<XUIChannel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showLoadForm, setShowLoadForm] = useState(false);
  const [useTranscoding] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const savedChannels = localStorage.getItem('xui-channels');
    const savedCredentials = localStorage.getItem('xui-credentials');
    if (savedChannels) {
      try {
        setChannels(JSON.parse(savedChannels));
        if (savedCredentials) {
          const creds = JSON.parse(savedCredentials);
          setCredentials(prev => ({ ...prev, playlistName: creds.playlistName || "" }));
        }
      } catch (e) {
        console.error("Error loading saved channels:", e);
      }
    } else {
      setShowLoadForm(true);
    }
  }, []);

  const clearChannels = () => {
    setChannels([]);
    setCredentials({
      server: "",
      port: "",
      username: "",
      password: "",
      playlistName: "",
    });
    setShowLoadForm(true);
    localStorage.removeItem('xui-channels');
    localStorage.removeItem('xui-credentials');
    toast({
      title: "Lista eliminada",
      description: "Todos los canales han sido eliminados",
    });
  };

  const buildM3UUrl = () => {
    const { server, port, username, password } = credentials;
    // Si el servidor ya tiene protocolo, usarlo; si no, agregar http://
    const protocol = server.startsWith('https://') || server.startsWith('http://') ? '' : 'http://';
    const baseUrl = `${protocol}${server}${port ? `:${port}` : ''}`;
    // Usar formato XUI correcto: /playlist/{username}/{password}/m3u?output=hls
    return `${baseUrl}/playlist/${encodeURIComponent(username)}/${encodeURIComponent(password)}/m3u?output=hls`;
  };

  const loadXUIPlaylist = async () => {
    const { server, username, password, playlistName } = credentials;
    
    if (!server || !username || !password) {
      toast({
        title: "Error",
        description: "Por favor completa servidor, usuario y contraseña",
        variant: "destructive",
      });
      return;
    }

    if (!playlistName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un nombre para la lista",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const m3uUrl = buildM3UUrl();
      
      const response = await fetch('/api/proxy/m3u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: m3uUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo conectar con el servidor XUI");
      }

      const { content } = await response.json();
      const playlist = parseM3U(content);
      
      const xuiChannels: XUIChannel[] = playlist.items.map(item => ({
        name: item.name,
        url: item.url,
        logo: item.tvg?.logo || undefined,
        group: item.group?.title || undefined,
        username: credentials.username,
        password: credentials.password,
      }));

      setChannels(xuiChannels);
      localStorage.setItem('xui-channels', JSON.stringify(xuiChannels));
      localStorage.setItem('xui-credentials', JSON.stringify({ playlistName: credentials.playlistName }));
      setShowLoadForm(false);

      toast({
        title: "¡Conectado!",
        description: `${xuiChannels.length} canales cargados de "${playlistName}"`,
      });
    } catch (error) {
      console.error("Error loading XUI playlist:", error);
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar con XUI",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          useTranscoding={useTranscoding}
          onClose={() => setCurrentChannel(null)}
          autoplay={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header content moved inline */}
        <div className="flex flex-col items-center gap-3 mb-8">
            <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em' }}>
              XUI CLIENT
            </h1>
            <Badge variant="outline" className="border-blue-600/50 text-blue-400">
              Versión XUI
            </Badge>
            {credentials.playlistName && channels.length > 0 && (
              <p className="text-sm font-medium text-gray-300">
                {credentials.playlistName}
              </p>
            )}
            
            {channels.length > 0 && (
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="border-red-600/50 text-red-500">
                  {channels.length} canales
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLoadForm(true)}
                  className="border-gray-700 text-gray-300 hover:bg-red-950/30 hover:border-red-800"
                >
                  Cambiar servidor
                </Button>
              </div>
            )}
        </div>
        {/* Link al Simple Player */}
        <div className="mb-4 flex justify-center">
          <Link href="/simple" className="text-gray-400 hover:text-red-500 text-sm transition-colors">
            ← Volver al reproductor simple (M3U directo)
          </Link>
        </div>

        {channels.length === 0 && !showLoadForm && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <ServerIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conectar con XUI</h2>
            <p className="text-gray-400 mb-8">Ingresa tus credenciales de XUI para ver tu lista de canales</p>
            <Button
              onClick={() => setShowLoadForm(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/50"
            >
              <ServerIcon className="w-4 h-4 mr-2" />
              Conectar Servidor
            </Button>
          </div>
        )}

        {showLoadForm && (
          <Card className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-blue-900/30 backdrop-blur-sm shadow-2xl mb-6 max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ServerIcon className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-white">
                    {channels.length > 0 ? "Cambiar Servidor XUI" : "Conectar con XUI"}
                  </CardTitle>
                </div>
                {channels.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoadForm(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-gray-400">
                Ingresa las credenciales de tu servidor XUI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Nombre de la lista (ej: Mi IPTV)"
                  value={credentials.playlistName}
                  onChange={(e) => setCredentials(prev => ({ ...prev, playlistName: e.target.value }))}
                  className="bg-gray-950/80 border-gray-800 text-white focus:border-blue-600 transition-colors"
                />
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <WifiIcon className="w-3 h-3" /> Servidor
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      type="text"
                      placeholder="dominio o IP"
                      value={credentials.server}
                      onChange={(e) => setCredentials(prev => ({ ...prev, server: e.target.value }))}
                      className="col-span-3 bg-gray-950/80 border-gray-800 text-white focus:border-blue-600 transition-colors"
                    />
                    <Input
                      type="text"
                      placeholder="Puerto"
                      value={credentials.port}
                      onChange={(e) => setCredentials(prev => ({ ...prev, port: e.target.value }))}
                      className="bg-gray-950/80 border-gray-800 text-white focus:border-blue-600 transition-colors text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-600">Deja el puerto vacío para usar el estándar (80/443)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> Usuario
                  </label>
                  <Input
                    type="text"
                    placeholder="Tu usuario de XUI"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-gray-950/80 border-gray-800 text-white focus:border-blue-600 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 flex items-center gap-1">
                    <KeyIcon className="w-3 h-3" /> Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Tu contraseña de XUI"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-gray-950/80 border-gray-800 text-white focus:border-blue-600 transition-colors"
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={loadXUIPlaylist}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-900/50 transition-all"
                  >
                    {isLoading ? "Conectando..." : "Conectar"}
                  </Button>
                  {channels.length > 0 && (
                    <Button
                      onClick={clearChannels}
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-red-950/30 hover:border-red-800 transition-all"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <p className="text-gray-500 text-xs text-center">
                  Las credenciales se usan solo para construir la URL del M3U
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {channels.length > 0 && (
          <>
            <div className="mb-6 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar canal..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-950/80 border-gray-800 text-white pl-10 focus:border-blue-600 transition-colors"
                  />
                </div>
                <div className="flex gap-1 bg-gray-950/80 border border-gray-800 rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className={viewMode === "grid" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-400 hover:text-white"}
                  >
                    <GridIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "bg-blue-600 hover:bg-blue-700" : "text-gray-400 hover:text-white"}
                  >
                    <ListIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {categories.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700">
                  {categories.map((cat) => (
                    <Badge
                      key={cat || "all"}
                      variant={selectedCategory === cat ? "default" : "outline"}
                      className={`cursor-pointer whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-600 shadow-lg shadow-blue-900/50"
                          : "border-gray-700 text-gray-400 hover:border-blue-600 hover:text-blue-500"
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
                    className="bg-gradient-to-br from-gray-900/80 to-gray-950/80 border-gray-800 hover:border-blue-600 hover:shadow-xl hover:shadow-blue-900/20 transition-all duration-300 cursor-pointer group overflow-hidden"
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
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <TvIcon className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <PlayIcon className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-white font-semibold truncate group-hover:text-blue-500 transition-colors text-sm">
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
                    className="bg-gradient-to-r from-gray-900/80 to-gray-950/80 border-gray-800 hover:border-blue-600 hover:shadow-lg hover:shadow-blue-900/20 transition-all cursor-pointer group"
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
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <TvIcon className="w-7 h-7 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate group-hover:text-blue-500 transition-colors">
                            {channel.name}
                          </h3>
                          {channel.group && (
                            <p className="text-gray-500 text-sm truncate">
                              {channel.group}
                            </p>
                          )}
                        </div>
                        <PlayIcon className="w-6 h-6 text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
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
