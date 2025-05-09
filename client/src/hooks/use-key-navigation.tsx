import { useEffect, useRef, useState } from "react";
import { REMOTE_KEYS } from "@/lib/constants";

interface KeyNavigationOptions {
  enabled?: boolean;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onBack?: () => void;
  onPlay?: () => void;
  preventDefaultKeys?: boolean;
}

export function useKeyNavigation({
  enabled = true,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onBack,
  onPlay,
  preventDefaultKeys = true,
}: KeyNavigationOptions = {}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      
      // Prevent default for navigation keys if requested
      if (preventDefaultKeys) {
        if (
          e.key === REMOTE_KEYS.UP ||
          e.key === REMOTE_KEYS.DOWN ||
          e.key === REMOTE_KEYS.LEFT ||
          e.key === REMOTE_KEYS.RIGHT ||
          e.key === REMOTE_KEYS.ENTER ||
          e.key === REMOTE_KEYS.BACK ||
          e.key === REMOTE_KEYS.PLAY_PAUSE
        ) {
          e.preventDefault();
        }
      }
      
      // Execute handler based on key
      switch (e.key) {
        case REMOTE_KEYS.UP:
          onArrowUp?.();
          break;
        case REMOTE_KEYS.DOWN:
          onArrowDown?.();
          break;
        case REMOTE_KEYS.LEFT:
          onArrowLeft?.();
          break;
        case REMOTE_KEYS.RIGHT:
          onArrowRight?.();
          break;
        case REMOTE_KEYS.ENTER:
          onEnter?.();
          break;
        case REMOTE_KEYS.BACK:
          onBack?.();
          break;
        case REMOTE_KEYS.PLAY_PAUSE:
          onPlay?.();
          break;
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onBack, onPlay, preventDefaultKeys]);
  
  const isKeyPressed = (key: string): boolean => {
    return keysPressed.current.has(key);
  };
  
  // Helper for grid-based navigation
  const createGridNavigation = (rowCount: number, colCount: number) => {
    return {
      navigateGrid: (currentIndex: number, direction: "up" | "down" | "left" | "right"): number => {
        let newIndex = currentIndex;
        
        switch (direction) {
          case "up":
            newIndex = currentIndex - colCount;
            if (newIndex < 0) {
              newIndex = (rowCount * colCount) - (colCount - (currentIndex % colCount));
              if (newIndex >= rowCount * colCount) {
                newIndex -= colCount;
              }
            }
            break;
          case "down":
            newIndex = currentIndex + colCount;
            if (newIndex >= rowCount * colCount) {
              newIndex = currentIndex % colCount;
            }
            break;
          case "left":
            if (currentIndex % colCount === 0) {
              newIndex = currentIndex + colCount - 1;
            } else {
              newIndex = currentIndex - 1;
            }
            break;
          case "right":
            if ((currentIndex + 1) % colCount === 0) {
              newIndex = currentIndex - colCount + 1;
            } else {
              newIndex = currentIndex + 1;
            }
            break;
        }
        
        return Math.max(0, Math.min(newIndex, rowCount * colCount - 1));
      }
    };
  };
  
  return {
    focusedIndex,
    setFocusedIndex,
    isKeyPressed,
    createGridNavigation,
  };
}
