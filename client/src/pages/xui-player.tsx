import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseM3U } from "@/lib/utils/m3u-parser";
import VideoPlayer from "@/components/player/video-player";
import { TvIcon, SearchIcon, Trash2Icon, ServerIcon, XIcon, KeyIcon, UserIcon, WifiIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import ChannelGrid from "@/components/channels/channel-grid";
import CategoryFilter from "@/components/channels/category-filter";
import { ChannelWithCategory } from "@/lib/types";
import { Category } from "@shared/schema";

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
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
    setSelectedCategoryId(null);
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
      setSelectedCategoryId(null);

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

  // Memoize mapped channels
  const { mappedChannels, categories } = useMemo(() => {
    const categoryMap = new Map<string, Category>();
    const mapped: ChannelWithCategory[] = [];

    channels.forEach((ch, index) => {
      const groupName = ch.group || "Sin categoría";

      let category = categoryMap.get(groupName);
      if (!category) {
        // Create fake category
        category = {
          id: -(categoryMap.size + 1), // Negative ID
          name: groupName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        categoryMap.set(groupName, category);
      }

      mapped.push({
        channel: {
            id: -(index + 1), // Negative ID
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                XUI CLIENT
                </h1>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-600/50 text-blue-400">
                    Versión XUI
                    </Badge>
                    {credentials.playlistName && (
                        <p className="text-sm font-medium text-muted-foreground">
                            {credentials.playlistName}
                        </p>
                    )}
                </div>
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
                    Cambiar servidor
                  </Button>
              </div>
            )}
        </div>

        {/* Link al Simple Player */}
        <div className="mb-4">
          <Link href="/simple">
             <Button variant="ghost" className="text-muted-foreground hover:text-primary pl-0">
               ← Volver al reproductor simple (M3U directo)
             </Button>
          </Link>
        </div>

        {channels.length === 0 && !showLoadForm && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ServerIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Conectar con XUI</h2>
            <p className="text-muted-foreground mb-8">Ingresa tus credenciales de XUI para ver tu lista de canales</p>
            <Button
              onClick={() => setShowLoadForm(true)}
              size="lg"
            >
              <ServerIcon className="w-4 h-4 mr-2" />
              Conectar Servidor
            </Button>
          </div>
        )}

        {showLoadForm && (
          <Card className="mb-6 max-w-md mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ServerIcon className="w-5 h-5 text-primary" />
                  <CardTitle>
                    {channels.length > 0 ? "Cambiar Servidor XUI" : "Conectar con XUI"}
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
                />
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <WifiIcon className="w-3 h-3" /> Servidor
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      type="text"
                      placeholder="dominio o IP"
                      value={credentials.server}
                      onChange={(e) => setCredentials(prev => ({ ...prev, server: e.target.value }))}
                      className="col-span-3"
                    />
                    <Input
                      type="text"
                      placeholder="Puerto"
                      value={credentials.port}
                      onChange={(e) => setCredentials(prev => ({ ...prev, port: e.target.value }))}
                      className="text-center"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Deja el puerto vacío para usar el estándar (80/443)</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <UserIcon className="w-3 h-3" /> Usuario
                  </label>
                  <Input
                    type="text"
                    placeholder="Tu usuario de XUI"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <KeyIcon className="w-3 h-3" /> Contraseña
                  </label>
                  <Input
                    type="password"
                    placeholder="Tu contraseña de XUI"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={loadXUIPlaylist}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Conectando..." : "Conectar"}
                  </Button>
                  {channels.length > 0 && (
                    <Button
                      onClick={clearChannels}
                      variant="outline"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                <p className="text-muted-foreground text-xs text-center">
                  Las credenciales se usan solo para construir la URL del M3U
                </p>
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
    </div>
  );
}
