import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { STORAGE_KEYS, DEFAULT_PLAYER_SETTINGS, API_ENDPOINTS } from "@/lib/constants";
import { Channel, Playlist } from "@shared/schema";
import { StorageData, PlayerSettings } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useStorage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Load data from local storage
  const loadFromStorage = useCallback(() => {
    try {
      // Load player settings
      const playerSettingsStr = localStorage.getItem(STORAGE_KEYS.PLAYER_SETTINGS);
      let playerSettings: PlayerSettings = DEFAULT_PLAYER_SETTINGS;
      
      if (playerSettingsStr) {
        try {
          const parsedSettings = JSON.parse(playerSettingsStr);
          playerSettings = {
            ...DEFAULT_PLAYER_SETTINGS,
            ...parsedSettings,
          };
        } catch (error) {
          console.error("Error parsing player settings:", error);
        }
      }
      
      // Save to backend if settings were loaded
      const saveSettingsToBackend = async () => {
        try {
          const response = await fetch(`${API_ENDPOINTS.SETTINGS}/playerSettings`);
          
          if (response.ok) {
            // Settings exist, update them
            await fetch(`${API_ENDPOINTS.SETTINGS}/playerSettings`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: playerSettings }),
            });
          } else if (response.status === 404) {
            // Settings don't exist, create them
            await fetch(`${API_ENDPOINTS.SETTINGS}/playerSettings`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ value: playerSettings }),
            });
          }
        } catch (error) {
          console.error("Error saving settings to backend:", error);
        }
      };
      
      saveSettingsToBackend();
      
      return {
        playerSettings,
      };
    } catch (error) {
      console.error("Error loading data from storage:", error);
      return {
        playerSettings: DEFAULT_PLAYER_SETTINGS,
      };
    }
  }, []);
  
  // Save player settings to storage
  const savePlayerSettings = useCallback((settings: PlayerSettings) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYER_SETTINGS, JSON.stringify(settings));
      
      // Also save to backend
      fetch(`${API_ENDPOINTS.SETTINGS}/playerSettings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: settings }),
      }).catch(error => {
        console.error("Error saving settings to backend:", error);
      });
      
      // Invalidate settings query
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.SETTINGS}/playerSettings`] });
      
      return true;
    } catch (error) {
      console.error("Error saving player settings:", error);
      toast({
        title: "Error",
        description: "Failed to save player settings",
        variant: "destructive",
      });
      return false;
    }
  }, [queryClient, toast]);
  
  return {
    loadFromStorage,
    savePlayerSettings,
  };
}
