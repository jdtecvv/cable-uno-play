import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/constants";
import { parseM3U } from "@/lib/utils/m3u-parser";
import { PlaylistInsert, ChannelInsert } from "@shared/schema";

export function usePlaylist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  /**
   * Imports a playlist and its channels
   */
  const importPlaylist = async (
    playlist: PlaylistInsert, 
    fileContent: string | null = null
  ) => {
    try {
      // Create the playlist first
      const response = await apiRequest("POST", API_ENDPOINTS.PLAYLISTS, playlist);
      const createdPlaylist = await response.json();
      
      // Check if we need to process channels from file content
      if (fileContent) {
        try {
          // Parse the M3U file content
          const parsed = parseM3U(fileContent);
          
          if (parsed.items.length === 0) {
            toast({
              title: "Empty playlist",
              description: "The playlist doesn't contain any channels",
              variant: "destructive"
            });
            return createdPlaylist;
          }
          
          // Transform parsed items to channel objects
          const channels: ChannelInsert[] = parsed.items.map((item) => ({
            playlistId: createdPlaylist.id,
            name: item.name,
            url: item.url,
            logo: item.tvg?.logo || null,
            epgId: item.tvg?.id || null,
            // Try to find category by title
            categoryId: null, // We'll resolve this later if possible
          }));
          
          // Insert channels
          if (channels.length > 0) {
            await apiRequest("POST", `${API_ENDPOINTS.CHANNELS}/bulk`, channels);
          }
          
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
        }
      }
      
      // If set to active, make sure UI updates
      if (playlist.isActive) {
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST] });
      }
      
      // Invalidate necessary queries
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLAYLISTS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CHANNELS] });
      
      return createdPlaylist;
    } catch (error) {
      console.error("Failed to import playlist:", error);
      throw error;
    }
  };
  
  /**
   * Set active playlist
   */
  const setActivePlaylist = async (playlistId: number) => {
    try {
      await apiRequest("PATCH", `${API_ENDPOINTS.PLAYLISTS}/${playlistId}/set-active`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLAYLISTS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST] });
      
      toast({
        title: "Active playlist updated",
        description: "The selected playlist is now active",
      });
    } catch (error) {
      console.error("Failed to set active playlist:", error);
      toast({
        title: "Error",
        description: "Failed to set active playlist",
        variant: "destructive"
      });
      throw error;
    }
  };
  
  /**
   * Delete a playlist
   */
  const deletePlaylist = async (playlistId: number) => {
    try {
      await apiRequest("DELETE", `${API_ENDPOINTS.PLAYLISTS}/${playlistId}`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLAYLISTS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CHANNELS] });
      
      toast({
        title: "Playlist deleted",
        description: "The playlist has been removed",
      });
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
    setActivePlaylist,
    deletePlaylist,
  };
}
