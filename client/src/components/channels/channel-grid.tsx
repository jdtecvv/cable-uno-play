import { useRef, useState, useEffect } from "react";
import ChannelCard from "./channel-card";
import { ChannelWithCategory } from "@/lib/types";
import { useKeyNavigation } from "@/hooks/use-key-navigation";

interface ChannelGridProps {
  channels: ChannelWithCategory[];
  title?: string;
  emptyMessage?: string;
}

export default function ChannelGrid({
  channels,
  title,
  emptyMessage = "No channels found",
}: ChannelGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(4);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  // Calculate column count based on grid width
  useEffect(() => {
    const updateColumnCount = () => {
      if (!gridRef.current) return;
      
      const gridWidth = gridRef.current.offsetWidth;
      
      if (gridWidth < 640) {
        setColumnCount(2);
      } else if (gridWidth < 768) {
        setColumnCount(3);
      } else if (gridWidth < 1024) {
        setColumnCount(4);
      } else if (gridWidth < 1280) {
        setColumnCount(5);
      } else {
        setColumnCount(6);
      }
    };
    
    updateColumnCount();
    
    const resizeObserver = new ResizeObserver(updateColumnCount);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  const handleKeyNavigate = (index: number, direction: "up" | "down" | "left" | "right") => {
    if (channels.length === 0) return;
    
    let newIndex = index;
    
    switch (direction) {
      case "up":
        newIndex = index - columnCount;
        break;
      case "down":
        newIndex = index + columnCount;
        break;
      case "left":
        newIndex = index - 1;
        break;
      case "right":
        newIndex = index + 1;
        break;
    }
    
    // Ensure new index is within bounds
    if (newIndex >= 0 && newIndex < channels.length) {
      setFocusedIndex(newIndex);
      
      // Focus the element at the new index
      const elements = gridRef.current?.querySelectorAll('.channel-card');
      if (elements && elements[newIndex]) {
        (elements[newIndex] as HTMLElement).focus();
      }
    }
  };
  
  return (
    <div>
      {title && <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">{title}</h2>}
      
      {channels.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-card rounded-lg">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          {channels.map((channel, index) => (
            <ChannelCard
              key={channel.channel.id}
              channel={channel}
              index={index}
              columnCount={columnCount}
              onKeyNavigate={(direction) => handleKeyNavigate(index, direction)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
