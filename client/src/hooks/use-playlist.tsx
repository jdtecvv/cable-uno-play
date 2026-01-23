import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { parseM3U } from "@/lib/utils/m3u-parser";
import { PlaylistInsert } from "@shared/schema";
import { savePlaylist, clearPlaylist as clearStoragePlaylist, SavedPlaylist } from "@/lib/storage";

export function usePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  /**
   * Imports a playlist and its channels (Client-Side Storage)
   */
  const importPlaylist = async (
    playlist: PlaylistInsert, 
    fileContent: string | null = null
  ) => {
    try {
      let channels: any[] = [];
      let contentToSave = fileContent;

      // If we have content, parse it to extract channels
      if (contentToSave) {
        try {
          const parsed = parseM3U(contentToSave);
          
          if (parsed.items.length === 0) {
            toast({
              title: "Empty playlist",
              description: "The playlist doesn't contain any channels",
              variant: "destructive"
            });
            return null;
          }
          
          // Map to internal format
          channels = parsed.items.map((item, index) => ({
            id: index + 1,
            name: item.name,
            url: item.url,
            logo: item.tvg?.logo || null,
            group: item.group?.title || "General",
            username: playlist.username,
            password: playlist.password
          }));
          
          toast({
            title: "Playlist imported",
            description: `Imported ${channels.length} channels from ${playlist.name}`,
          });
        } catch (error) {
          console.error("Failed to parse M3U content:", error);
          toast({
            title: "Invalid M3U format",
            description: "The file doesn't appear to be a valid M3U playlist",
            variant: "destructive"
          });
          return null;
        }
      }

      // Prepare playlist object for local storage
      const savedPlaylist: SavedPlaylist = {
        name: playlist.name,
        type: playlist.providerType === 'xtream' ? 'xui' : 'm3u',
        url: playlist.url,
        username: playlist.username || undefined,
        password: playlist.password || undefined,
        content: contentToSave || undefined,
        channels: channels
      };

      // Save to localStorage
      savePlaylist(savedPlaylist);
      
      return savedPlaylist;
    } catch (error) {
      console.error("Failed to import playlist:", error);
      throw error;
    }
  };
  
  /**
   * Clear active playlist (disconnect)
   */
  const deletePlaylist = async (playlistId?: number) => {
    try {
      clearStoragePlaylist();
      
      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed from this device",
      });

      // Force reload to clear state or redirect
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete playlist:", error);
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  return {
    importPlaylist,
    deletePlaylist,
    // Legacy support alias
    setActivePlaylist: async () => {},
  };
}
