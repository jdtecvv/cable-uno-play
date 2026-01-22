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
  username?: string;
  password?: string;
  useTranscoding?: boolean; // Enable FFmpeg audio transcoding for incompatible formats
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
  ({ channel, onClose, autoplay = true, username, password, useTranscoding = false }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const transcodingSessionIdRef = useRef<string | null>(null);
    const [hls, setHls] = useState<Hls | null>(null);
    const [isTranscoding, setIsTranscoding] = useState(false);
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

    // Generate unique session ID for this player instance (persists across segment requests)
    const sessionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

    // Initialize HLS.js
    useEffect(() => {
      if (!videoRef.current || !channel?.url) return;
      
      setIsBuffering(true);
      setError(null);
      setIsTranscoding(false); // Reset transcoding state on channel change
      
      let isMounted = true;
      const sessionId = sessionIdRef.current;
  
      const setupHls = async (urlToPlay: string, isTranscoded = false) => {
        let streamUrl = urlToPlay;

        // Only apply URL fixes/proxy logic if NOT already transcoded
        if (!isTranscoded) {
          // Fix XUI malformed URLs with extra colon after domain
          if (streamUrl.includes('://') && streamUrl.match(/:\/\/[^/]+:\/[^/]/)) {
            streamUrl = streamUrl.replace(/:\/([^/])/, '/$1');
            console.log(`🔧 Fixed malformed URL (removed extra colon): ${streamUrl}`);
          }

          // Convert XUI /ts URLs to /m3u8 for HLS.js compatibility
          // XUI streams ending in /ts are MPEG-TS direct streams, not HLS playlists
          if (streamUrl.endsWith('/ts')) {
            streamUrl = streamUrl.replace(/\/ts$/, '/m3u8');
            console.log(`🔄 Converted XUI URL from /ts to /m3u8: ${streamUrl}`);
          }

          // Route XUI streams through backend proxy (tokens are port-bound to :81)
          const isXUIStream = streamUrl.includes('app.teleunotv.cr') ||
                             streamUrl.includes('190.61.110.177');

          if (isXUIStream) {
            console.log(`🔄 Routing XUI stream through proxy: ${streamUrl}`);
            streamUrl = `/api/proxy/stream?url=${encodeURIComponent(streamUrl)}`;
          } else if (streamUrl.startsWith('http://')) {
            // Use proxy for other HTTP streams (mixed content protection)
            console.log(`🔄 Routing HTTP stream through proxy: ${streamUrl}`);
            streamUrl = `/api/proxy/stream?url=${encodeURIComponent(streamUrl)}`;
          }
        }
        
        // Check again before creating HLS instance
        if (!isMounted) return;

        if (Hls.isSupported()) {
          const hlsInstance = new Hls({
            // Optimized for IPTV streaming - larger buffers for stability
            maxBufferLength: 60,           // 60 seconds of buffer
            maxMaxBufferLength: 120,       // Max 2 minutes buffer
            maxBufferSize: 60 * 1000 * 1000, // 60MB buffer size
            maxBufferHole: 0.5,            // Allow small gaps
            lowLatencyMode: false,         // Disable low latency for stability
            enableWorker: true,            // Enable web worker for better performance (audio)
            startLevel: -1,                // Auto quality selection
            abrEwmaDefaultEstimate: 500000, // 500kbps initial estimate
            abrBandWidthFactor: 0.95,      // Conservative bandwidth usage
            abrBandWidthUpFactor: 0.7,     // Slow to upgrade quality
            fragLoadingTimeOut: 20000,     // 20s timeout for segments
            fragLoadingMaxRetry: 6,        // Retry 6 times
            fragLoadingRetryDelay: 1000,   // 1s between retries
            manifestLoadingTimeOut: 15000, // 15s timeout for manifest
            manifestLoadingMaxRetry: 4,    // Retry manifest 4 times
            levelLoadingTimeOut: 15000,    // 15s timeout for level
            // Set default audio codec to AAC (mp4a.40.2) for better compatibility
            defaultAudioCodec: 'mp4a.40.2',
            // Intercept ALL XHR requests made by HLS.js
            xhrSetup: function(xhr: XMLHttpRequest, url: string) {
              let finalUrl = url;
              
              // Fix XUI malformed URLs with extra colon after domain
              if (finalUrl.includes('://') && finalUrl.match(/:\/\/[^/]+:\/[^/]/)) {
                finalUrl = finalUrl.replace(/:\/([^/])/, '/$1');
              }
              
              // Check if this is an XUI URL that needs to go through the proxy
              const isXUIStream = finalUrl.includes('app.teleunotv.cr') || 
                                 finalUrl.includes('190.61.110.177');
              
              if (isXUIStream && !finalUrl.startsWith('/api/proxy/stream')) {
                // Route XUI segments through proxy (tokens are port-bound)
                const proxiedUrl = `/api/proxy/stream?url=${encodeURIComponent(finalUrl)}`;
                console.log(`🔄 HLS segment routed through proxy: ${finalUrl}`);
                xhr.open('GET', proxiedUrl, true);
                
                if (username && password) {
                  const credentials = btoa(`${username}:${password}`);
                  xhr.setRequestHeader('X-Stream-Auth', credentials);
                }
                return;
              }
              
              // Handle other HTTP URLs - redirect through proxy to avoid Mixed Content
              if (finalUrl.startsWith('http://')) {
                const proxiedUrl = `/api/proxy/stream?url=${encodeURIComponent(finalUrl)}`;
                xhr.open('GET', proxiedUrl, true);
                
                if (username && password) {
                  const credentials = btoa(`${username}:${password}`);
                  xhr.setRequestHeader('X-Stream-Auth', credentials);
                }
              } else if (finalUrl.startsWith('/api/proxy/stream')) {
                // Already proxied URL - add credentials
                if (username && password) {
                  const credentials = btoa(`${username}:${password}`);
                  xhr.setRequestHeader('X-Stream-Auth', credentials);
                }
              }
            },
          });
          
          hlsInstance.loadSource(streamUrl);
          hlsInstance.attachMedia(videoRef.current!);
          
          hlsRef.current = hlsInstance;
          
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
            // Check for AC3/EC3 audio only (which browsers can't play)
            // If ONLY AC3/EC3 tracks exist and we haven't transcoded yet, trigger transcoding
            if (!isTranscoded) {
              const hasPlayableAudio = hlsInstance.audioTracks.some(track => {
                const codec = (track.audioCodec || '').toLowerCase();
                const name = (track.name || '').toLowerCase();
                return codec.includes('mp4a') || codec.includes('aac') || name.includes('stereo') || name.includes('aac');
              });

              const hasAC3 = hlsInstance.audioTracks.some(track => {
                const codec = (track.audioCodec || '').toLowerCase();
                return codec.includes('ac-3') || codec.includes('ec-3');
              });

              if (!hasPlayableAudio && hasAC3) {
                console.log("⚠️ No playable AAC/Stereo track found. AC3 detected. Triggering transcoding...");
                handleTranscoding();
                return;
              }
            }

            // Attempt to select Stereo/AAC track if available
            try {
              if (hlsInstance.audioTracks && hlsInstance.audioTracks.length > 1) {
                const stereoTrackIndex = hlsInstance.audioTracks.findIndex(track => {
                  const name = (track.name || '').toLowerCase();
                  const codec = (track.audioCodec || '').toLowerCase();
                  return name.includes('stereo') || name.includes('aac') || codec.includes('mp4a');
                });

                if (stereoTrackIndex !== -1 && hlsInstance.audioTrack !== stereoTrackIndex) {
                  console.log(`🔊 Switching to optimized audio track: ${hlsInstance.audioTracks[stereoTrackIndex].name} (Index ${stereoTrackIndex})`);
                  hlsInstance.audioTrack = stereoTrackIndex;
                }
              }
            } catch (e) {
              console.warn("Audio track selection failed:", e);
            }

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
                  // Try to transcode on media error if we haven't already
                  if (!isTranscoded) {
                    console.log("⚠️ Media error detected. Attempting transcoding fallback...");
                    handleTranscoding();
                  } else {
                    hlsInstance.recoverMediaError();
                  }
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

      const handleTranscoding = async () => {
        if (!isMounted) return;
        setIsTranscoding(true);
        setIsBuffering(true);

        try {
          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }

          toast({
            title: "Optimizing Audio",
            description: "Transcoding AC3 audio to AAC...",
          });

          // Create transcoding session
          const response = await fetch('/api/proxy/stream-transcode/sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(username && password ? { 'X-Stream-Auth': btoa(`${username}:${password}`) } : {})
            },
            body: JSON.stringify({ url: channel.url }),
          });

          if (!response.ok) throw new Error("Transcoding failed");

          const data = await response.json();
          transcodingSessionIdRef.current = data.sessionId;

          // Re-init HLS with new playlist URL
          if (isMounted) {
            setupHls(data.playlistUrl, true);
          }

        } catch (err) {
          console.error("Transcoding setup failed:", err);
          setError("Failed to optimize stream audio.");
          setIsBuffering(false);
        }
      };
      
      setupHls(channel.url, false);
      
      // Clean up
      return () => {
        // Mark as unmounted to prevent async operations from proceeding
        isMounted = false;
        
        // Destroy HLS.js instance
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
        
        if (controlsTimerRef.current) {
          window.clearTimeout(controlsTimerRef.current);
        }

        // Cleanup transcoding session if exists
        // Note: If fetch is still pending, isMounted=false will trigger cleanup in setupHls
        if (transcodingSessionIdRef.current) {
          const sessionId = transcodingSessionIdRef.current;
          transcodingSessionIdRef.current = null;
          
          fetch(`/api/proxy/stream-transcode/sessions/${sessionId}`, {
            method: 'DELETE',
          }).catch(error => {
            console.error('Failed to cleanup transcoding session:', error);
          });
        }
      };
    }, [channel?.url, autoplay, toast, username, password, useTranscoding]);

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
