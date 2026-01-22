import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLocation } from "wouter";
import XUIPlayer from "./xui-player";
import { useEffect } from "react";

export default function RootRedirect() {
  const [, navigate] = useLocation();

  // Check for active playlist
  const { data: activePlaylist, isLoading, error } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
    retry: false, // Don't retry if 404 (no active playlist)
  });

  useEffect(() => {
    if (activePlaylist && !isLoading) {
      console.log("Found active playlist, redirecting to dashboard...");
      navigate("/live");
    }
  }, [activePlaylist, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  // If no active playlist (or error), show the Import Screen (XUIPlayer)
  return <XUIPlayer />;
}
