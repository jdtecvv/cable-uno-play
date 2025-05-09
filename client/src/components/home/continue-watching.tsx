import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import ChannelGrid from "@/components/channels/channel-grid";

interface ContinueWatchingProps {
  limit?: number;
}

export default function ContinueWatching({ limit = 10 }: ContinueWatchingProps) {
  const queryClient = useQueryClient();
  
  // Fetch recently watched channels
  const { data: recentChannels = [], isLoading, error } = useQuery({
    queryKey: [API_ENDPOINTS.RECENT, limit],
    retry: 1,
  });
  
  // Prefetch channel details
  useEffect(() => {
    if (recentChannels && recentChannels.length > 0) {
      recentChannels.forEach((channelData: any) => {
        queryClient.prefetchQuery({
          queryKey: [`${API_ENDPOINTS.CHANNELS}/${channelData.channel.id}`],
        });
      });
    }
  }, [recentChannels, queryClient]);
  
  if (isLoading) {
    return (
      <section className="px-4 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Continue Watching</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-card rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse"></div>
              <div className="p-3">
                <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  
  if (error) {
    return (
      <section className="px-4 py-6">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">Continue Watching</h2>
        <div className="bg-card p-4 rounded-lg text-muted-foreground">
          Unable to load recently watched channels.
        </div>
      </section>
    );
  }
  
  if (recentChannels.length === 0) {
    return null; // Don't show this section if there are no recent channels
  }
  
  return (
    <section className="px-4 py-6">
      <ChannelGrid 
        channels={recentChannels}
        title="Continue Watching"
        emptyMessage="You haven't watched any channels yet."
      />
    </section>
  );
}
