import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  MuteIcon,
  FullscreenIcon,
  SubtitlesIcon,
  FavoriteIcon,
  FavoriteFillIcon,
  ArrowLeftIcon,
} from "@/components/ui/icons";
import { VideoPlayerRef } from "./video-player";

interface PlayerControlsProps {
  playerRef: React.RefObject<VideoPlayerRef>;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFavorite: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onToggleFavorite: () => void;
  onSeek?: (time: number) => void;
  onClose: () => void;
  channelName: string;
  categoryName?: string;
  isLive?: boolean;
}

export default function PlayerControls({
  playerRef,
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  isFavorite,
  onVolumeChange,
  onToggleMute,
  onTogglePlay,
  onToggleFullscreen,
  onToggleFavorite,
  onSeek,
  onClose,
  channelName,
  categoryName,
  isLive = true,
}: PlayerControlsProps) {
  const [visible, setVisible] = useState(true);
  const [controlsTimer, setControlsTimer] = useState<number | null>(null);

  useEffect(() => {
    // Auto-hide controls after 3 seconds if video is playing
    if (visible && isPlaying) {
      const timer = window.setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      setControlsTimer(timer);
      
      return () => {
        if (timer) window.clearTimeout(timer);
      };
    }
  }, [visible, isPlaying]);

  const resetControlsTimer = () => {
    if (controlsTimer) {
      window.clearTimeout(controlsTimer);
      setControlsTimer(null);
    }
    
    setVisible(true);
    
    // Re-initialize the timer
    if (isPlaying) {
      const timer = window.setTimeout(() => {
        setVisible(false);
      }, 3000);
      
      setControlsTimer(timer);
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="controls-fade absolute inset-0 flex flex-col z-10"
      onClick={(e) => e.stopPropagation()}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Top Controls */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:text-primary focus-visible"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </Button>
          <div className="ml-4">
            <h2 className="text-white font-bold text-xl">{channelName}</h2>
            {categoryName && <p className="text-gray-300 text-sm">{categoryName}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            className="text-white hover:text-primary focus-visible"
          >
            {isFavorite ? (
              <FavoriteFillIcon className="h-6 w-6 text-primary" />
            ) : (
              <FavoriteIcon className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Center Play/Pause Button (for touch devices) */}
      <div className="flex-1 flex items-center justify-center">
        <Button 
          variant="ghost"
          size="icon"
          className="bg-black/40 hover:bg-primary/70 text-white p-6 rounded-full focus-visible"
          onClick={onTogglePlay}
        >
          {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
        </Button>
      </div>
      
      {/* Bottom Controls */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar - Only show for non-live content */}
        {!isLive && duration > 0 && (
          <div className="flex items-center mb-4">
            <span className="text-white text-sm mr-2">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 h-1 bg-white/20 rounded overflow-hidden mx-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={1}
                onValueChange={(values) => onSeek && onSeek(values[0])}
                className="z-20"
              />
            </div>
            <span className="text-white text-sm ml-2">
              {formatTime(duration)}
            </span>
          </div>
        )}
        
        {/* Live Badge - Only show for live content */}
        {isLive && (
          <div className="flex items-center mb-4">
            <div className="bg-primary text-white text-xs px-2 py-1 rounded inline-flex items-center">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-white inline-block"></span>
              LIVE
            </div>
          </div>
        )}
        
        {/* Control Buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={onTogglePlay}
              className="text-white hover:text-primary focus-visible"
            >
              {isPlaying ? <PauseIcon className="h-6 w-6" /> : <PlayIcon className="h-6 w-6" />}
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              className="text-white hover:text-primary focus-visible"
            >
              {isMuted ? <MuteIcon className="h-6 w-6" /> : <VolumeIcon className="h-6 w-6" />}
            </Button>
            
            <div className="hidden sm:flex items-center w-24 mx-2">
              <Slider
                value={[volume]}
                min={0}
                max={100}
                step={1}
                onValueChange={onVolumeChange}
                className="z-20"
              />
            </div>
            
            <Button 
              variant="ghost"
              size="icon"
              onClick={onToggleFullscreen}
              className="text-white hover:text-primary focus-visible"
            >
              <FullscreenIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
