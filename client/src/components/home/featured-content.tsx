import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { PlayIcon, ImportIcon } from "@/components/ui/icons";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ImportPlaylist from "@/components/dialogs/import-playlist";

export default function FeaturedContent() {
  const [, navigate] = useLocation();
  
  // Check if there's an active playlist
  const { data: activePlaylist, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
  });
  
  const hasActivePlaylist = !!activePlaylist;
  
  const handleStartWatching = () => {
    if (hasActivePlaylist) {
      navigate("/live");
    } else {
      // If no active playlist, prompt to import one
      document.getElementById("import-playlist-trigger")?.click();
    }
  };
  
  return (
    <section className="relative">
      <div className="h-64 md:h-80 lg:h-96 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-90 z-10"></div>
        <div className="absolute inset-0">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
        </div>
        
        <div className="absolute bottom-0 left-0 p-6 z-20 max-w-3xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Watch Anywhere
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl mb-4">
            Stream your favorite channels on any device with our advanced IPTV platform
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-primary hover:bg-primary-dark text-white"
              size="lg"
              onClick={handleStartWatching}
            >
              <PlayIcon className="mr-2 h-5 w-5" />
              Start Watching
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  id="import-playlist-trigger"
                  variant="outline"
                  size="lg"
                  className="flex items-center"
                >
                  <ImportIcon className="mr-2 h-5 w-5" />
                  Import M3U
                </Button>
              </DialogTrigger>
              <DialogContent>
                <ImportPlaylist />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
}
