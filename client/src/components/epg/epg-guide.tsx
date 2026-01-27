import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { useLocation } from "wouter";
import { getActivePlaylist } from "@/lib/storage";
import { getProxiedImageUrl } from "@/lib/utils";
import { ChannelWithCategory } from "@/lib/types";

interface EPGGuideProps {
  activeChannelId?: number | null;
}

export default function EPGGuide({ activeChannelId }: EPGGuideProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [, navigate] = useLocation();
  const timelineRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);
  const [channels, setChannels] = useState<ChannelWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load channels from client-side storage
  useEffect(() => {
    const loadChannels = () => {
      setIsLoading(true);
      try {
        const playlist = getActivePlaylist();
        if (playlist && playlist.channels) {
          // Map stored channels to the format expected by the view
          // Note: client-side channels are simple objects, we wrap them to match ChannelWithCategory
          const mapped: ChannelWithCategory[] = playlist.channels.map((ch: any, index: number) => ({
            channel: {
              id: ch.id || index + 1,
              name: ch.name,
              url: ch.url,
              logo: ch.logo,
              playlistId: 0,
              categoryId: 0,
              epgId: ch.epgId || null,
              isFavorite: false,
              lastWatched: null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            category: {
              id: 0,
              name: ch.group || "General",
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }));
          setChannels(mapped);
        } else {
          setChannels([]);
        }
      } catch (err) {
        console.error("Failed to load channels for EPG:", err);
        setChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, []);

  // Calculate time slots for the guide
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);
  
  // Generate formatted date string
  const formattedDate = format(currentDate, "EEEE, MMMM d");
  const isToday = isSameDay(currentDate, new Date());
  
  // Handle navigation between days
  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };
  
  const goToNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Scroll to current time on initial load for today's view
  useEffect(() => {
    if (isToday && timelineRef.current && currentTimeRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Calculate position based on current hour
      const hourWidth = timelineRef.current.scrollWidth / 24;
      const scrollPosition = hourWidth * currentHour - (timelineRef.current.clientWidth / 2);
      
      timelineRef.current.scrollLeft = Math.max(0, scrollPosition);
    }
  }, [isToday, channels]);
  
  // Handle play channel
  const handlePlayChannel = (channelId: number) => {
    navigate(`/watch/${channelId}`);
  };
  
  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <div className="flex justify-between items-center p-4 border-b border-border">
        <h2 className="text-xl font-bold text-foreground">TV Guide</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousDay}
            className="focus-visible"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          
          <Button
            variant={isToday ? "secondary" : "outline"}
            size="sm"
            onClick={goToToday}
            className="focus-visible"
          >
            Today
          </Button>
          
          <div className="bg-muted px-4 py-2 rounded text-foreground">
            {formattedDate}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextDay}
            className="focus-visible"
          >
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full epg-grid">
          {/* EPG Header (Time) */}
          <div className="flex border-b border-border">
            <div className="w-48 min-w-[12rem] p-3 font-medium text-muted-foreground border-r border-border bg-muted">
              Channel
            </div>
            <div ref={timelineRef} className="epg-timeline">
              {timeSlots.map(hour => (
                <div 
                  key={hour}
                  className="p-3 font-medium text-muted-foreground border-r border-border bg-muted text-center"
                >
                  {`${hour}:00`}
                </div>
              ))}
              
              {/* Current time indicator (only for today) */}
              {isToday && (
                <div 
                  ref={currentTimeRef}
                  className="absolute top-0 bottom-0 w-0.5 bg-primary z-10"
                  style={{ 
                    left: `${(new Date().getHours() * 60 + new Date().getMinutes()) / (24 * 60) * 100}%` 
                  }}
                >
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-primary"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* EPG Rows (Channels and Programs) */}
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading TV guide...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No channels available. Import a playlist first.
            </div>
          ) : (
            channels.map((item) => (
              <div 
                key={item.channel.id}
                className={`flex border-b border-border ${
                  activeChannelId === item.channel.id ? 'bg-muted/20' : ''
                }`}
              >
                <div 
                  className="w-48 min-w-[12rem] p-3 flex items-center border-r border-border bg-card cursor-pointer hover:bg-muted/30"
                  onClick={() => handlePlayChannel(item.channel.id)}
                >
                  {item.channel.logo ? (
                    <img 
                      src={getProxiedImageUrl(item.channel.logo)}
                      alt={item.channel.name}
                      className="mr-2 h-8 w-8 rounded object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/default-channel.png';
                      }}
                    />
                  ) : (
                    <div className="mr-2 h-8 w-8 rounded bg-muted flex items-center justify-center">
                      <span className="text-xs">{item.channel.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="font-medium text-foreground truncate">{item.channel.name}</span>
                </div>
                
                {/* Programs timeline - Empty for now as we removed fake data */}
                <div className="epg-timeline relative bg-card/50">
                   <div className="absolute top-0 bottom-0 left-[25%] w-px bg-border opacity-50"></div>
                   <div className="absolute top-0 bottom-0 left-[50%] w-px bg-border opacity-50"></div>
                   <div className="absolute top-0 bottom-0 left-[75%] w-px bg-border opacity-50"></div>

                   <div className="p-3 text-xs text-muted-foreground">
                      No program information available
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
