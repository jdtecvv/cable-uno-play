import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerIcon, UserIcon, KeyIcon, WifiIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { usePlaylist } from "@/hooks/use-playlist";

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { importPlaylist } = usePlaylist();

  const buildM3UUrl = () => {
    const { server, port, username, password } = credentials;
    // Ensure protocol is present
    let baseUrl = server.trim();
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `http://${baseUrl}`;
    }
    // Remove trailing slash
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const portStr = port.trim() ? `:${port.trim()}` : '';
    // XUI M3U Format: /get.php?username=...&password=...&type=m3u_plus&output=ts
    // OR /playlist/username/password/m3u?output=hls
    // We'll use the standard /get.php format or the one specific to the panel
    // Most Xtream Codes panels support: http://domain:port/get.php?username=X&password=Y&type=m3u_plus&output=ts

    // However, the original code used: /playlist/{username}/{password}/m3u?output=hls
    // Let's stick to that if it was working, or fallback to get.php

    return `${baseUrl}${portStr}/playlist/${encodeURIComponent(username.trim())}/${encodeURIComponent(password.trim())}/m3u?output=hls`;
  };

  const handleConnect = async () => {
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
      
      // 1. Fetch the playlist content via proxy
      const response = await fetch('/api/proxy/m3u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: m3uUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "No se pudo conectar con el servidor");
      }

      const { content } = await response.json();
      
      // 2. Import to Database
      await importPlaylist({
        name: playlistName,
        url: m3uUrl, // Save the dynamic URL
        username: username,
        password: password,
        providerType: 'xtream', // Mark as Xtream/XUI
        isActive: true,
      }, content);

      toast({
        title: "¡Conectado!",
        description: "Lista importada correctamente. Redirigiendo...",
      });

      // 3. Redirect to Dashboard (LiveTV)
      setTimeout(() => {
         navigate("/live");
      }, 1000);

    } catch (error) {
      console.error("Error connecting/importing:", error);
      toast({
        title: "Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar o importar la lista",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ServerIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Conectar Servicio de Cable</h1>
          <p className="text-muted-foreground">
            Ingresa tus credenciales para importar los canales al sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Credenciales XUI / Xtream</CardTitle>
            <CardDescription>
              Configura tu conexión al servidor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Nombre para la lista (ej: Mi Cable)"
                  value={credentials.playlistName}
                  onChange={(e) => setCredentials(prev => ({ ...prev, playlistName: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <WifiIcon className="w-3 h-3" /> Servidor (URL o IP)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    type="text"
                    placeholder="ej: play.miservidor.com"
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
                <p className="text-xs text-muted-foreground">
                  Deja el puerto vacío si usas 80/443
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> Usuario
                </label>
                <Input
                  type="text"
                  placeholder="Tu usuario"
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
                  placeholder="Tu contraseña"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? "Conectando e Importando..." : "Conectar"}
              </Button>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
