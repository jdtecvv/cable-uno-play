import { Switch, Route } from "wouter";
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
import Layout from "@/components/layout/layout";
import { useStorage } from "@/hooks/use-storage";
import { useEffect } from "react";

function Router() {
  const { loadFromStorage } = useStorage();
  
  // Load stored data when app starts
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
  
  return (
    <Switch>
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
