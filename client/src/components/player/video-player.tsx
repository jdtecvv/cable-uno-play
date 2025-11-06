import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Hls from "hls.js";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  MuteIcon,
  FullscreenIcon,
  SettingsIcon,
  SubtitlesIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FavoriteIcon,
  FavoriteFillIcon,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_PLAYER_SETTINGS, REMOTE_KEYS } from "@/lib/constants";
import { usePlayer } from "@/hooks/use-player";
import PlayerControls from "./player-controls";
import { useKeyNavigation } from "@/hooks/use-key-navigation";
import { Channel } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

export interface VideoPlayerProps {
  channel: Channel;
  onClose?: () => void;
  autoplay?: boolean;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (time: number) => void;
  toggleFullscreen: () => void;
  isPlaying: () => boolean;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ channel, onClose, autoplay = true }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const [hls, setHls] = useState<Hls | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(DEFAULT_PLAYER_SETTINGS.volume);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const controlsTimerRef = useRef<number | null>(null);
    const isMobile = useMobile();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const hideControlsTimer = () => {
      if (controlsTimerRef.current) {
        window.clearTimeout(controlsTimerRef.current);
      }
      
      if (isPlaying) {
        controlsTimerRef.current = window.setTimeout(() => {
          setIsControlsVisible(false);
        }, 3000);
      }
    };

    const showControls = () => {
      setIsControlsVisible(true);
      hideControlsTimer();
    };

    // Mark channel as recently watched when played
    useEffect(() => {
      if (channel?.id) {
        apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channel.id}/update-last-watched`)
          .then(() => {
            // Invalidate recent channels query
            queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RECENT] });
          })
          .catch(error => {
            console.error("Failed to update last watched status:", error);
          });
      }
    }, [channel?.id, queryClient]);

    // Initialize HLS.js
    useEffect(() => {
      if (!videoRef.current || !channel?.url) return;
      
      setIsBuffering(true);
      setError(null);
  
      const setupHls = () => {
        // Convert HTTP URLs to use proxy to avoid Mixed Content issues
        const getProxiedUrl = (url: string): string => {
          if (url.startsWith('http://')) {
            // Use proxy for HTTP streams when page is HTTPS
            return `/api/proxy/stream?url=${encodeURIComponent(url)}`;
          }
          return url;
        };

        if (Hls.isSupported()) {
          const hlsInstance = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            lowLatencyMode: true,
            // Intercept ALL XHR requests made by HLS.js to proxy HTTP URLs
            xhrSetup: function(xhr: XMLHttpRequest, url: string) {
              // If HLS is trying to load an HTTP URL, redirect through proxy
              if (url.startsWith('http://')) {
                const proxiedUrl = `/api/proxy/stream?url=${encodeURIComponent(url)}`;
                xhr.open('GET', proxiedUrl, true);
              }
            },
          });
          
          const streamUrl = getProxiedUrl(channel.url);
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(videoRef.current!);
          
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            if (autoplay) {
              videoRef.current?.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                })
                .catch(err => {
                  console.error("Error auto-playing video:", err);
                  setIsPlaying(false);
                  setIsBuffering(false);
                });
            } else {
              setIsBuffering(false);
            }
          });
          
          hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.error("Fatal network error", data);
                  hlsInstance.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.error("Fatal media error", data);
                  hlsInstance.recoverMediaError();
                  break;
                default:
                  console.error("Fatal error", data);
                  setError("Cannot play this stream. Please try another channel.");
                  toast({
                    title: "Playback Error",
                    description: "Cannot play this stream. Please try another channel.",
                    variant: "destructive",
                  });
                  break;
              }
            }
          });
          
          setHls(hlsInstance);
        } else if (videoRef.current?.canPlayType("application/vnd.apple.mpegurl")) {
          // For browsers that support HLS natively (Safari)
          const streamUrl = getProxiedUrl(channel.url);
          videoRef.current.src = streamUrl;
          videoRef.current.addEventListener("loadedmetadata", () => {
            if (autoplay) {
              videoRef.current?.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                })
                .catch(err => {
                  console.error("Error auto-playing video:", err);
                  setIsPlaying(false);
                  setIsBuffering(false);
                });
            } else {
              setIsBuffering(false);
            }
          });
        } else {
          setError("HLS playback is not supported in this browser.");
          toast({
            title: "Playback Error",
            description: "HLS playback is not supported in this browser.",
            variant: "destructive",
          });
        }
      };
      
      setupHls();
      
      // Clean up
      return () => {
        if (hls) {
          hls.destroy();
        }
        
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
        }
      };
    }, [channel?.url, autoplay, toast]);

    // Expose functions via ref
    useImperativeHandle(ref, () => ({
      play: () => {
        if (videoRef.current) {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.error("Error playing video:", err));
        }
      },
      pause: () => {
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      togglePlay: () => {
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
          } else {
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(err => console.error("Error playing video:", err));
          }
        }
      },
      setVolume: (vol: number) => {
        if (videoRef.current) {
          const clampedVolume = Math.max(0, Math.min(1, vol / 100));
          videoRef.current.volume = clampedVolume;
          setVolume(vol);
          if (clampedVolume === 0) {
            setIsMuted(true);
          } else {
            setIsMuted(false);
          }
        }
      },
      toggleMute: () => {
        if (videoRef.current) {
          videoRef.current.muted = !isMuted;
          setIsMuted(!isMuted);
        }
      },
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      toggleFullscreen: () => {
        toggleFullscreen();
      },
      isPlaying: () => isPlaying,
    }));

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else {
          videoRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => console.error("Error playing video:", err));
        }
      }
    };

    const handleVolumeChange = (value: number[]) => {
      if (videoRef.current) {
        const newVolume = value[0];
        const volumeNormalized = newVolume / 100;
        videoRef.current.volume = volumeNormalized;
        setVolume(newVolume);
        if (newVolume === 0) {
          setIsMuted(true);
        } else if (isMuted) {
          setIsMuted(false);
        }
      }
    };

    const toggleMute = () => {
      if (videoRef.current) {
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
      }
    };

    const toggleFullscreen = () => {
      if (!playerContainerRef.current) return;
      
      if (!document.fullscreenElement) {
        playerContainerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
          })
          .catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
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
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case REMOTE_KEYS.PLAY_PAUSE:
          togglePlay();
          showControls();
          break;
        case REMOTE_KEYS.VOLUME_UP:
          if (videoRef.current) {
            const newVolume = Math.min(100, volume + 5);
            handleVolumeChange([newVolume]);
            showControls();
          }
          break;
        case REMOTE_KEYS.VOLUME_DOWN:
          if (videoRef.current) {
            const newVolume = Math.max(0, volume - 5);
            handleVolumeChange([newVolume]);
            showControls();
          }
          break;
        case REMOTE_KEYS.MUTE:
          toggleMute();
          showControls();
          break;
        case REMOTE_KEYS.FULLSCREEN:
          toggleFullscreen();
          showControls();
          break;
        case REMOTE_KEYS.BACK:
          if (onClose) onClose();
          break;
      }
    };

    // Set up keyboard event listeners
    useEffect(() => {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleKeyDown]);

    // Toggle favorite status
    const handleToggleFavorite = async () => {
      if (!channel?.id) return;
      
      try {
        await apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channel.id}/toggle-favorite`);
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CHANNELS] });
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FAVORITES] });
        
        toast({
          title: channel.isFavorite ? "Removed from favorites" : "Added to favorites",
          description: `${channel.name} has been ${channel.isFavorite ? "removed from" : "added to"} your favorites.`,
        });
      } catch (error) {
        console.error("Failed to toggle favorite:", error);
        toast({
          title: "Error",
          description: "Failed to update favorites. Please try again.",
          variant: "destructive",
        });
      }
    };

    return (
      <div 
        ref={playerContainerRef} 
        className="relative h-full w-full video-container bg-black"
        onMouseMove={showControls}
        onTouchStart={showControls}
        onClick={isMobile ? () => setIsControlsVisible(!isControlsVisible) : undefined}
      >
        <video 
          ref={videoRef} 
          className="w-full h-full" 
          playsInline
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
        />
        
        {/* Loading overlay */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-white text-lg">Loading stream...</p>
            </div>
          </div>
        )}
        
        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-10">
            <div className="bg-card p-6 rounded-lg max-w-md">
              <h3 className="text-lg font-medium mb-2">Playback Error</h3>
              <p className="mb-4">{error}</p>
              <div className="flex justify-end">
                <Button onClick={onClose}>Back</Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Video Controls */}
        {isControlsVisible && !error && (
          <div className="controls-fade absolute inset-0 flex flex-col z-10">
            {/* Top Controls */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:text-primary"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </Button>
                <div className="ml-4">
                  <h2 className="text-white font-bold text-xl">{channel?.name}</h2>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className="text-white hover:text-primary"
                >
                  {channel?.isFavorite ? <FavoriteFillIcon className="h-6 w-6 text-primary" /> : <FavoriteIcon className="h-6 w-6" />}
                </Button>
              </div>
            </div>
            
            {/* Center Play/Pause Button */}
            <div className="flex-1 flex items-center justify-center">
              <Button 
                variant="ghost"
                size="icon"
                className="bg-black/40 hover:bg-primary/70 text-white p-6 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
              </Button>
            </div>
            
            {/* Bottom Controls */}
            <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress Bar (Live content might not have a duration) */}
              {duration > 0 && (
                <div className="flex items-center mb-4">
                  <span className="text-white text-sm mr-2">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-1 bg-white/20 rounded overflow-hidden mx-2">
                    <div 
                      className="bg-primary h-full"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-white text-sm ml-2">
                    {formatTime(duration)}
                  </span>
                </div>
              )}
              
              {/* Control Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:text-primary"
                  >
                    {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="text-white hover:text-primary"
                  >
                    {isMuted ? <MuteIcon className="h-6 w-6" /> : <VolumeIcon className="h-6 w-6" />}
                  </Button>
                  
                  <div className="hidden sm:flex items-center w-24 mx-2">
                    <Slider
                      value={[volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="z-20"
                    />
                  </div>
                  
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:text-primary"
                  >
                    <FullscreenIcon className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = "VideoPlayer";

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

export default VideoPlayer;
