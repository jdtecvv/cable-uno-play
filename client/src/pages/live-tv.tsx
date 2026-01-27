import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import ChannelGrid from "@/components/channels/channel-grid";
import CategoryFilter from "@/components/channels/category-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "@/components/ui/icons";
import { getActivePlaylist } from "@/lib/storage";
import { ChannelWithCategory } from "@/lib/types";
import { Category } from "@shared/schema";

export default function LiveTV() {
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [playlistName, setPlaylistName] = useState<string>("");
  
  // Load playlist from LocalStorage
  useEffect(() => {
    const playlist = getActivePlaylist();
    if (!playlist) {
      navigate("/"); // Redirect to import if no playlist
      return;
    }

    setPlaylistName(playlist.name);
    if (playlist.channels) {
      setChannels(playlist.channels);
    }
  }, [navigate]);

  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const category = params.get("category");
    const search = params.get("search");
    
    if (category) setCategoryId(Number(category));
    else setCategoryId(null);
    
    if (search) setSearchTerm(search);
    else setSearchTerm("");
  }, [location]);

  // Transform raw channels into ChannelWithCategory format for grid
  const { mappedChannels, categories } = useMemo(() => {
    const categoryMap = new Map<string, Category>();
    const mapped: ChannelWithCategory[] = [];

    channels.forEach((ch, index) => {
      const groupName = ch.group || "General";
      let category = categoryMap.get(groupName);

      // Assign persistent IDs to categories based on name hash or simple counter
      // For client-side, we can just use negative IDs to avoid DB conflict logic
      if (!category) {
        category = {
          id: -(categoryMap.size + 1),
          name: groupName,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        categoryMap.set(groupName, category);
      }

      mapped.push({
        channel: {
          id: ch.id || index + 1,
          name: ch.name,
          url: ch.url,
          logo: ch.logo,
          playlistId: 0,
          categoryId: category.id,
          epgId: null,
          isFavorite: false,
          lastWatched: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        category: category
      });
    });

    return {
      mappedChannels: mapped,
      categories: Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
    };
  }, [channels]);

  // Filter logic
  const displayedChannels = mappedChannels.filter(item => {
    const matchesSearch = item.channel.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryId === null || item.category?.id === categoryId;
    return matchesSearch && matchesCategory;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set("search", searchTerm);
      window.history.pushState({}, "", `/live?${params.toString()}`);
    } else {
      window.history.pushState({}, "", `/live`);
      setCategoryId(null);
    }
  };

  const handlePlay = (channelItem: ChannelWithCategory) => {
    const playlist = getActivePlaylist();
    navigate(`/watch/${channelItem.channel.id}`);
  };

  return (
    <div className="px-4 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {playlistName || "TV en Vivo"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {categories.length} Categorías | {mappedChannels.length} Canales
          </p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="flex w-full md:w-auto">
          <Input
            type="text"
            placeholder="Buscar canal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mr-2"
          />
          <Button type="submit" variant="secondary">
            <SearchIcon className="mr-2 h-4 w-4" />
            Buscar
          </Button>
        </form>
      </div>
      
      {!searchTerm && (
        <div className="mb-6">
          <CategoryFilter
            categories={categories}
            selectedCategoryId={categoryId}
            onSelect={(id) => {
                if (id) {
                    window.history.pushState({}, "", `/live?category=${id}`);
                    setCategoryId(id);
                } else {
                    window.history.pushState({}, "", `/live`);
                    setCategoryId(null);
                }
            }}
          />
        </div>
      )}
      
      <ChannelGrid
        channels={displayedChannels}
        onPlay={handlePlay}
        emptyMessage={
          searchTerm
            ? `No se encontraron canales para "${searchTerm}"`
            : "No hay canales disponibles."
        }
      />
    </div>
  );
}
