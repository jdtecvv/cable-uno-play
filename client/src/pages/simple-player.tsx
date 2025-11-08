import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseM3U } from "@/lib/utils/m3u-parser";
import VideoPlayer from "@/components/player/video-player";
import { PlayIcon, XIcon } from "lucide-react";
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

  const filteredChannels = channels.filter(ch =>
    ch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-black p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <img 
            src="/images/cable-uno-logo.png" 
            alt="Cable Uno" 
            className="h-16 mx-auto mb-4"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-4xl font-bold text-white mb-2">Cable Uno Play</h1>
          <p className="text-gray-300">Reproductor Simple - Sin Base de Datos</p>
        </div>

        <Card className="bg-gray-900/80 border-red-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Cargar Lista M3U</CardTitle>
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
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Button
                  onClick={loadM3U}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white whitespace-nowrap"
                >
                  {isLoading ? "Cargando..." : "Cargar"}
                </Button>
                {channels.length > 0 && (
                  <Button
                    onClick={clearChannels}
                    variant="outline"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800 whitespace-nowrap"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  placeholder="Usuario (opcional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <Input
                  type="password"
                  placeholder="Contraseña (opcional)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              
              <p className="text-gray-500 text-xs">
                Solo ingresa usuario y contraseña si tu proveedor IPTV lo requiere
              </p>
            </div>
          </CardContent>
        </Card>

        {channels.length > 0 && (
          <>
            <div className="mb-4">
              <Input
                type="text"
                placeholder="Buscar canal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredChannels.map((channel, index) => (
                <Card
                  key={index}
                  className="bg-gray-900/80 border-gray-800 hover:border-red-600 transition-all cursor-pointer group"
                  onClick={() => setCurrentChannel(channel)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {channel.logo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          className="w-12 h-12 object-contain rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-red-600/20 rounded flex items-center justify-center">
                          <PlayIcon className="w-6 h-6 text-red-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate group-hover:text-red-500">
                          {channel.name}
                        </h3>
                        {channel.group && (
                          <p className="text-gray-500 text-sm truncate">
                            {channel.group}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredChannels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-400">No se encontraron canales con "{searchTerm}"</p>
              </div>
            )}
          </>
        )}

        {channels.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No hay canales cargados. Ingresa una URL de M3U arriba para comenzar.
            </p>
            <p className="text-gray-500 text-sm">
              Ejemplo: http://ejemplo.com/lista.m3u8
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
