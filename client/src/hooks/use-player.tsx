import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS, DEFAULT_PLAYER_SETTINGS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { VideoPlayerRef } from "@/components/player/video-player";

export function usePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_PLAYER_SETTINGS.volume);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize player settings from storage
  useEffect(() => {
    const initializePlayerSettings = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.SETTINGS}/playerSettings`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data?.value) {
            setVolume(data.value.volume ?? DEFAULT_PLAYER_SETTINGS.volume);
            setIsMuted(data.value.volume === 0);
          }
        }
      } catch (error) {
        console.error("Failed to load player settings:", error);
      }
    };
    
    initializePlayerSettings();
  }, []);
  
  // Toggle play/pause
  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  };
  
  // Set volume
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    // Save volume setting
    apiRequest("PUT", `${API_ENDPOINTS.SETTINGS}/playerSettings`, {
      value: {
        volume: newVolume,
        autoplay: DEFAULT_PLAYER_SETTINGS.autoplay,
        rememberLastChannel: DEFAULT_PLAYER_SETTINGS.rememberLastChannel,
        bufferingTime: DEFAULT_PLAYER_SETTINGS.bufferingTime,
      }
    }).catch(error => {
      console.error("Failed to save volume setting:", error);
    });
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (playerRef.current) {
      playerRef.current.toggleMute();
      setIsMuted(!isMuted);
    }
  };
  
  // Seek to position
  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(time);
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
            toast({
              title: "Fullscreen Error",
              description: "Could not enter fullscreen mode",
              variant: "destructive",
            });
          });
      } else {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            console.error("Error attempting to exit fullscreen:", err);
          });
      }
    }
  };
  
  // Handle toggling favorite status
  const toggleFavorite = async (channelId: number) => {
    if (!channelId) return;
    
    try {
      await apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channelId}/toggle-favorite`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CHANNELS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FAVORITES] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.CHANNELS}/${channelId}`] });
      
    } catch (error) {
      console.error("Failed to toggle favorite status:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive"
      });
    }
  };
  
  // Update last watched status
  const updateLastWatched = async (channelId: number) => {
    if (!channelId) return;
    
    try {
      await apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channelId}/update-last-watched`);
      
      // Invalidate recent channels
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RECENT] });
      
    } catch (error) {
      console.error("Failed to update last watched status:", error);
    }
  };
  
  return {
    isPlaying,
    setIsPlaying,
    isMuted,
    setIsMuted,
    volume,
    setVolume,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isFullscreen,
    setIsFullscreen,
    isLoading,
    setIsLoading,
    error,
    setError,
    playerRef,
    containerRef,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    seekTo,
    toggleFullscreen,
    toggleFavorite,
    updateLastWatched,
  };
}
