import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import VideoPlayer from "@/components/player/video-player";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { getActivePlaylist } from "@/lib/storage";
import { Channel } from "@shared/schema";

export default function Watch() {
  const { channelId } = useParams<{ channelId: string }>();
  const [, navigate] = useLocation();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlistCreds, setPlaylistCreds] = useState<{username?: string, password?: string}>({});

  useEffect(() => {
    const playlist = getActivePlaylist();
    if (!playlist || !playlist.channels) {
      navigate("/");
      return;
    }

    const found = playlist.channels.find((c: any) => String(c.id) === channelId);
    if (found) {
        // Map storage channel to Schema channel for player compatibility
        const mappedChannel: Channel = {
            id: found.id,
            name: found.name,
            url: found.url,
            logo: found.logo,
            playlistId: 0,
            categoryId: null,
            epgId: null,
            isFavorite: false,
            lastWatched: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        setChannel(mappedChannel);
        setPlaylistCreds({ username: playlist.username, password: playlist.password });
    }
  }, [channelId, navigate]);

  if (!channel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando canal...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-black">
      <VideoPlayer
        channel={channel}
        username={playlistCreds.username}
        password={playlistCreds.password}
        onClose={() => navigate("/live")}
        autoplay={true}
      />
    </div>
  );
}
