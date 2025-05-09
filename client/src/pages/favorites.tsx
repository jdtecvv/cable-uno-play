import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import ChannelGrid from "@/components/channels/channel-grid";
import { useKeyNavigation } from "@/hooks/use-key-navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ImportPlaylist from "@/components/dialogs/import-playlist";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Favorites() {
  const queryClient = useQueryClient();
  
  // Fetch active playlist
  const { data: activePlaylist, isLoading: playlistLoading } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
  });
  
  // Fetch favorite channels
  const { data: favoriteChannels = [], isLoading: favoritesLoading } = useQuery({
    queryKey: [API_ENDPOINTS.FAVORITES],
  });
  
  // Enable keyboard navigation
  useKeyNavigation({
    enabled: true,
  });
  
  // Prefetch channel details
  useEffect(() => {
    if (favoriteChannels && favoriteChannels.length > 0) {
      favoriteChannels.forEach((channel: any) => {
        queryClient.prefetchQuery({
          queryKey: [`${API_ENDPOINTS.CHANNELS}/${channel.channel.id}`],
        });
      });
    }
  }, [favoriteChannels, queryClient]);
  
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Favorite Channels</h1>
      </div>
      
      {playlistLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : !activePlaylist ? (
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Active Playlist</AlertTitle>
            <AlertDescription>
              You need to import or activate a playlist to add favorite channels.
            </AlertDescription>
          </Alert>
          
          <div className="text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mx-auto">
                  Import Playlist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <ImportPlaylist />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <ChannelGrid
          channels={favoriteChannels}
          emptyMessage={
            favoritesLoading
              ? "Loading favorite channels..."
              : "You haven't added any favorite channels yet. Click the heart icon on a channel to add it to favorites."
          }
        />
      )}
    </div>
  );
}
