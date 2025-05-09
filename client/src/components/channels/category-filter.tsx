import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useLocation } from "wouter";

interface CategoryFilterProps {
  selectedCategoryId?: number | null;
  showAll?: boolean;
}

export default function CategoryFilter({
  selectedCategoryId,
  showAll = true,
}: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [, navigate] = useLocation();
  
  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  // Scroll selected category into view
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [selectedCategoryId, categories]);
  
  const handleCategoryClick = (categoryId?: number) => {
    if (categoryId) {
      navigate(`/live?category=${categoryId}`);
    } else {
      navigate('/live');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-4">
        <Button className="bg-muted animate-pulse" disabled>
          Loading...
        </Button>
      </div>
    );
  }
  
  return (
    <ScrollArea orientation="horizontal" className="pb-4 mb-4">
      <div ref={scrollRef} className="flex items-center space-x-2 min-w-full whitespace-nowrap">
        {showAll && (
          <Button
            ref={selectedCategoryId === null || selectedCategoryId === undefined ? selectedRef : undefined}
            className={!selectedCategoryId ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"}
            variant={!selectedCategoryId ? "default" : "outline"}
            onClick={() => handleCategoryClick()}
          >
            All
          </Button>
        )}
        
        {categories.map((category: any) => (
          <Button
            key={category.id}
            ref={selectedCategoryId === category.id ? selectedRef : undefined}
            className={selectedCategoryId === category.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"}
            variant={selectedCategoryId === category.id ? "default" : "outline"}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
