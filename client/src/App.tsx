import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Layout from "@/components/layout/layout";
import Home from "@/pages/home";
import LiveTV from "@/pages/live-tv";
import Guide from "@/pages/guide";
import Favorites from "@/pages/favorites";
import Watch from "@/pages/watch";
import Setup from "@/pages/setup";
import SimplePlayer from "@/pages/simple-player";
import NotFound from "@/pages/not-found";
import { ThemeProvider } from "./lib/theme-provider";

function Router() {
  return (
    <Switch>
      {/* Setup page - sin layout */}
      <Route path="/setup" component={Setup} />
      
      {/* Simple Player - modo standalone sin base de datos */}
      <Route path="/simple" component={SimplePlayer} />
      
      {/* Aplicación completa con layout y base de datos */}
      <Route path="/">
        <Layout>
          <Home />
        </Layout>
      </Route>
      
      <Route path="/live">
        <Layout>
          <LiveTV />
        </Layout>
      </Route>
      
      <Route path="/guide">
        <Layout>
          <Guide />
        </Layout>
      </Route>
      
      <Route path="/favorites">
        <Layout>
          <Favorites />
        </Layout>
      </Route>
      
      <Route path="/watch/:channelId">
        <Layout>
          <Watch />
        </Layout>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
