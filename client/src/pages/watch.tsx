import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import VideoPlayer from "@/components/player/video-player";
import { usePlayer } from "@/hooks/use-player";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function Watch() {
  const { channelId } = useParams<{ channelId: string }>();
  const [, navigate] = useLocation();
  const {
    isPlaying,
    setIsPlaying,
    isMuted,
    volume,
    playerRef,
    containerRef,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    toggleFullscreen,
    toggleFavorite,
    updateLastWatched,
  } = usePlayer();

  // Fetch channel data
  const { data: channelData, isLoading: channelLoading, error: channelError } = useQuery({
    queryKey: [`${API_ENDPOINTS.CHANNELS}/${channelId}`],
  });

  // Handle back navigation
  const handleBack = () => {
    navigate("/live");
  };

  // Mark channel as viewed when component mounts
  useEffect(() => {
    if (channelId) {
      updateLastWatched(Number(channelId));
    }
  }, [channelId, updateLastWatched]);

  // Handle errors
  if (channelError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load channel information. The channel may not exist or there was a network error.
            </AlertDescription>
          </Alert>
          <Button onClick={handleBack} className="w-full">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Channels
          </Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (channelLoading || !channelData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading channel...</p>
        </div>
      </div>
    );
  }

  const channel = channelData.channel;
  const category = channelData.category;

  return (
    <div ref={containerRef} className="h-screen w-full bg-black">
      <VideoPlayer
        ref={playerRef}
        channel={channel}
        onClose={handleBack}
        autoplay={true}
      />
    </div>
  );
}
