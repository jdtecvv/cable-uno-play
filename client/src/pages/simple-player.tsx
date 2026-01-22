import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DownloadIcon, TvIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { savePlaylist } from "@/lib/storage";
import { parseM3U } from "@/lib/utils/m3u-parser";

export default function SimplePlayer() {
  const [m3uUrl, setM3uUrl] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleLoad = async () => {
    const urlToLoad = m3uUrl.trim();
    const nameToLoad = playlistName.trim();
    
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
      // 1. Fetch via proxy
      const response = await fetch('/api/proxy/m3u', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToLoad }),
      });

      if (!response.ok) {
        throw new Error("No se pudo descargar la lista");
      }

      const { content } = await response.json();

      // 2. Parse client-side
      const parsed = parseM3U(content);
      const channels = parsed.items.map((item, index) => ({
        id: index + 1,
        name: item.name,
        url: item.url,
        logo: item.tvg?.logo || null,
        group: item.group?.title || "General",
      }));

      // 3. Save to localStorage
      savePlaylist({
        name: nameToLoad,
        type: 'm3u',
        url: urlToLoad,
        content,
        channels
      });

      toast({
        title: "¡Éxito!",
        description: "Lista guardada localmente.",
      });

      setTimeout(() => {
        navigate("/live");
      }, 1000);

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

  return (
    <div className="h-full w-full overflow-y-auto px-4 py-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <TvIcon className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Importar Lista M3U</h1>
          <p className="text-muted-foreground">
            La lista se guardará localmente en tu navegador.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DownloadIcon className="w-5 h-5 text-primary" />
              <CardTitle>Cargar URL M3U</CardTitle>
            </div>
            <CardDescription>
              Ingresa la información de tu lista IPTV
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
              </div>

              <Button
                onClick={handleLoad}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Guardando..." : "Cargar y Guardar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
