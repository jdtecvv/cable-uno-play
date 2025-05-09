import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FavoriteIcon, FavoriteFillIcon } from "@/components/ui/icons";
import { ChannelWithCategory } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DEFAULT_IMAGES, API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useKeyNavigation } from "@/hooks/use-key-navigation";

interface ChannelCardProps {
  channel: ChannelWithCategory;
  index?: number;
  columnCount?: number;
  onKeyNavigate?: (direction: "up" | "down" | "left" | "right") => void;
}

export default function ChannelCard({
  channel,
  index,
  columnCount,
  onKeyNavigate,
}: ChannelCardProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFocused, setIsFocused] = useState(false);
  
  const channelData = channel.channel;
  const category = channel.category;
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      await apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channelData.id}/toggle-favorite`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CHANNELS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FAVORITES] });
      
      toast({
        title: channelData.isFavorite ? "Removed from favorites" : "Added to favorites",
        description: `${channelData.name} has been ${channelData.isFavorite ? "removed from" : "added to"} your favorites.`,
      });
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorite status. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handlePlayChannel = () => {
    // Update last watched timestamp
    apiRequest("PATCH", `${API_ENDPOINTS.CHANNELS}/${channelData.id}/update-last-watched`)
      .then(() => {
        // Invalidate recent channels query
        queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RECENT] });
      })
      .catch(error => {
        console.error("Failed to update last watched status:", error);
      });
    
    // Navigate to watch page
    navigate(`/watch/${channelData.id}`);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onKeyNavigate) return;
    
    switch (e.key) {
      case "ArrowUp":
        onKeyNavigate("up");
        break;
      case "ArrowDown":
        onKeyNavigate("down");
        break;
      case "ArrowLeft":
        onKeyNavigate("left");
        break;
      case "ArrowRight":
        onKeyNavigate("right");
        break;
      case "Enter":
        handlePlayChannel();
        break;
    }
  };
  
  // Use logo or default image
  const logoUrl = channelData.logo || DEFAULT_IMAGES.CHANNEL_THUMBNAIL;
  
  return (
    <Card 
      className={`channel-card overflow-hidden cursor-pointer hover:shadow-md transition-all ${
        isFocused ? "ring-2 ring-primary" : ""
      }`}
      onClick={handlePlayChannel}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
    >
      <div className="relative">
        <div className="aspect-video bg-muted">
          <img 
            src={logoUrl} 
            alt={channelData.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMAGES.CHANNEL_THUMBNAIL;
            }}
          />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
          <div className="bg-primary text-white text-xs px-2 py-1 rounded inline-block">
            LIVE
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <Button 
            variant="ghost"
            size="icon"
            className="text-white bg-black/40 hover:bg-primary rounded-full w-8 h-8"
            onClick={handleToggleFavorite}
            tabIndex={-1}
          >
            {channelData.isFavorite ? (
              <FavoriteFillIcon className="h-4 w-4" />
            ) : (
              <FavoriteIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-foreground truncate">{channelData.name}</h3>
        {category && (
          <p className="text-muted-foreground text-sm">{category.name}</p>
        )}
      </CardContent>
    </Card>
  );
}
