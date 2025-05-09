import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import FeaturedContent from "@/components/home/featured-content";
import ContinueWatching from "@/components/home/continue-watching";
import ChannelGrid from "@/components/channels/channel-grid";
import { useQuery } from "@tanstack/react-query";
import { useKeyNavigation } from "@/hooks/use-key-navigation";

export default function Home() {
  const queryClient = useQueryClient();
  
  // Pre-fetch channels and categories
  useEffect(() => {
    queryClient.prefetchQuery({ queryKey: [API_ENDPOINTS.CHANNELS] });
    queryClient.prefetchQuery({ queryKey: [API_ENDPOINTS.CATEGORIES] });
    queryClient.prefetchQuery({ queryKey: [API_ENDPOINTS.RECENT] });
  }, [queryClient]);
  
  // Fetch popular channels (currently just all channels, limited to 12)
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CHANNELS],
    select: (data) => data.slice(0, 12), // Limit to 12 for display
  });
  
  // Enable keyboard navigation
  useKeyNavigation({
    enabled: true,
  });
  
  return (
    <div className="min-h-full">
      {/* Featured content at the top */}
      <FeaturedContent />
      
      {/* Continue watching section */}
      <ContinueWatching />
      
      {/* Popular channels section */}
      <section className="px-4 py-6">
        <ChannelGrid 
          channels={channels}
          title="Popular Channels"
          emptyMessage={channelsLoading ? "Loading channels..." : "No channels available"}
        />
      </section>
    </div>
  );
}
