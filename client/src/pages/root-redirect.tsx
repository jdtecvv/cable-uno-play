import { useLocation } from "wouter";
import { getActivePlaylist } from "@/lib/storage";
import { useEffect, useState } from "react";
import XUIPlayer from "./xui-player";

export default function RootRedirect() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlaylist, setHasPlaylist] = useState(false);

  useEffect(() => {
    const playlist = getActivePlaylist();
    if (playlist && playlist.channels && playlist.channels.length > 0) {
      setHasPlaylist(true);
      console.log("Found client-side playlist, redirecting...");
      navigate("/live");
    } else {
      setHasPlaylist(false);
    }
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no active playlist, show the Import Screen (XUIPlayer)
  return <XUIPlayer />;
}
