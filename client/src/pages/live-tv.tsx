import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { API_ENDPOINTS } from "@/lib/constants";
import ChannelGrid from "@/components/channels/channel-grid";
import CategoryFilter from "@/components/channels/category-filter";
import { useKeyNavigation } from "@/hooks/use-key-navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";

export default function LiveTV() {
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  
  // Parse query params from URL
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const category = params.get("category");
    const search = params.get("search");
    
    if (category) {
      setCategoryId(Number(category));
    } else {
      setCategoryId(null);
    }
    
    if (search) {
      setSearchTerm(search);
    } else {
      setSearchTerm("");
    }
  }, [location]);
  
  // Fetch active playlist
  const { data: activePlaylist } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
  });
  
  // Fetch channels
  const { data: allChannels = [], isLoading: allChannelsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CHANNELS],
  });
  
  // Fetch channels by category if categoryId is set
  const { data: categoryChannels = [], isLoading: categoryChannelsLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES, categoryId, "channels"],
    enabled: categoryId !== null,
  });
  
  // Fetch search results if searchTerm is set
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: [API_ENDPOINTS.SEARCH, searchTerm],
    enabled: searchTerm.length > 0,
  });
  
  // Determine which channels to display
  const displayedChannels = searchTerm
    ? searchResults
    : categoryId !== null
      ? categoryChannels
      : allChannels;
  
  const isLoading = searchTerm
    ? searchLoading
    : categoryId !== null
      ? categoryChannelsLoading
      : allChannelsLoading;
  
  // Get the selected category name
  const { data: categories = [] } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  const selectedCategory = categories.find((cat: any) => cat.id === categoryId);
  
  // Enable keyboard navigation
  useKeyNavigation({
    enabled: true,
  });
  
  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchTerm.trim()) {
      // Update the URL to include the search term
      const params = new URLSearchParams();
      params.set("search", searchTerm);
      window.history.pushState({}, "", `/live?${params.toString()}`);
      
      // Trigger search
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.SEARCH, searchTerm] });
    } else {
      // Clear search
      window.history.pushState({}, "", `/live`);
      setCategoryId(null);
    }
  };
  
  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          {searchTerm
            ? `Search: ${searchTerm}`
            : categoryId !== null
              ? selectedCategory
                ? `${selectedCategory.name} Channels`
                : "Category Channels"
              : "All Channels"}
        </h1>
        
        <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search channels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mr-2"
          />
          <Button type="submit" variant="secondary">
            <SearchIcon className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>
      </div>
      
      {!searchTerm && (
        <div className="mb-6">
          <CategoryFilter selectedCategoryId={categoryId} />
        </div>
      )}
      
      {!activePlaylist && !isLoading && (
        <div className="bg-card p-6 rounded-lg mb-6">
          <h2 className="text-lg font-medium mb-2">No Active Playlist</h2>
          <p className="text-muted-foreground mb-4">
            You need to import or activate a playlist to view channels.
          </p>
          <Button onClick={() => document.getElementById("import-playlist-trigger")?.click()}>
            Import Playlist
          </Button>
        </div>
      )}
      
      <ChannelGrid
        channels={displayedChannels}
        emptyMessage={
          isLoading
            ? "Loading channels..."
            : searchTerm
              ? "No channels found for your search"
              : categoryId !== null
                ? "No channels in this category"
                : "No channels available"
        }
      />
    </div>
  );
}
