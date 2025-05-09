import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "./lib/theme-provider";
import Home from "@/pages/home";
import LiveTV from "@/pages/live-tv";
import Guide from "@/pages/guide";
import Favorites from "@/pages/favorites";
import Watch from "@/pages/watch";
import Setup from "@/pages/setup";
import Layout from "@/components/layout/layout";
import { useStorage } from "@/hooks/use-storage";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";

function Router() {
  const { loadFromStorage } = useStorage();
  const [, setLocation] = useLocation();
  const [initialized, setInitialized] = useState(false);
  
  // Verificar si hay playlists activas para determinar si mostrar la pantalla de configuración
  const { data: activePlaylist, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
    // Si hay errores (como 404), no mostrar
    retry: false,
    // Mostrar error 404 como null
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch(API_ENDPOINTS.ACTIVE_PLAYLIST, { signal });
        if (res.status === 404) return null;
        return res.json();
      } catch (error) {
        return null;
      }
    }
  });
  
  // Verificar si hay al menos un canal
  const { data: channels = [], isLoading: isLoadingChannels } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.CHANNELS],
    enabled: !isLoading && initialized,
  });
  
  // Load stored data when app starts
  useEffect(() => {
    loadFromStorage();
    setInitialized(true);
  }, [loadFromStorage]);
  
  // Redirigir a la página de configuración si no hay lista activa o canales
  const [location] = useLocation();
  useEffect(() => {
    if (!isLoading && !isLoadingChannels && initialized) {
      const hasActivePlaylist = !!activePlaylist;
      const hasChannels = channels && channels.length > 0;
      
      // Si estamos en la ruta principal y no hay playlist activa o no hay canales,
      // redirigir a la página de configuración
      if (location === "/" && (!hasActivePlaylist || !hasChannels)) {
        setLocation("/setup");
      }
    }
  }, [activePlaylist, channels, isLoading, isLoadingChannels, initialized, setLocation, location]);
  
  return (
    <Switch>
      <Route path="/setup" component={Setup} />
      <Route path="/" component={Home} />
      <Route path="/live" component={LiveTV} />
      <Route path="/guide" component={Guide} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/watch/:channelId" component={Watch} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
