import { useState, useEffect } from "react";
import EPGGuide from "@/components/epg/epg-guide";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ImportPlaylist from "@/components/dialogs/import-playlist";
import { Button } from "@/components/ui/button";
import { useKeyNavigation } from "@/hooks/use-key-navigation";
import { getActivePlaylist } from "@/lib/storage";

export default function Guide() {
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [hasPlaylist, setHasPlaylist] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for active playlist in local storage
  useEffect(() => {
    const checkPlaylist = () => {
      try {
        const playlist = getActivePlaylist();
        setHasPlaylist(!!playlist && !!playlist.channels && playlist.channels.length > 0);
      } catch (e) {
        console.error("Error checking playlist:", e);
        setHasPlaylist(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPlaylist();
  }, []);
  
  // Enable keyboard navigation
  useKeyNavigation({
    enabled: true,
  });
  
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">TV Guide</h1>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : !hasPlaylist ? (
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Active Playlist</AlertTitle>
            <AlertDescription>
              You need to import or activate a playlist to view the TV guide.
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
        <>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>EPG Implementation</AlertTitle>
            <AlertDescription>
              The Electronic Program Guide is currently showing a simplified view.
              Detailed program information would be populated from XMLTV data.
            </AlertDescription>
          </Alert>
          
          <EPGGuide activeChannelId={selectedChannelId} />
        </>
      )}
    </div>
  );
}
