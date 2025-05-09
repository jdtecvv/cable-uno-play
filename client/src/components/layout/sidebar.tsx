import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  TVIcon, 
  LiveIcon, 
  GuideIcon, 
  FavoriteIcon, 
  ImportIcon, 
  PlaylistIcon 
} from "@/components/ui/icons";
import { MAIN_MENU_ITEMS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import ImportPlaylist from "@/components/dialogs/import-playlist";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();
  const isMobile = useMobile();
  
  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: [API_ENDPOINTS.CATEGORIES],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch active playlist
  const { data: activePlaylist } = useQuery({
    queryKey: [API_ENDPOINTS.ACTIVE_PLAYLIST],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  // Determine if we should actually render the sidebar
  // On mobile, we only render if it's open
  if (isMobile && !isOpen) {
    return null;
  }
  
  // Fixed sidebar for desktop, overlay for mobile
  const sidebarClasses = isMobile
    ? "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out"
    : "hidden md:block w-64 border-r border-border bg-sidebar overflow-y-auto";
  
  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
    
      <aside className={sidebarClasses}>
        <ScrollArea className="h-full py-4">
          <nav>
            <ul>
              <li className="px-4 py-2 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                Main Menu
              </li>
              
              <li>
                <Button
                  variant={location === "/" ? "secondary" : "ghost"}
                  className={`w-full justify-start px-4 py-3 text-foreground rounded-md mx-2 ${
                    location === "/" ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleNavigation("/")}
                >
                  <TVIcon className="mr-3 h-5 w-5" />
                  <span>Home</span>
                </Button>
              </li>
              
              <li>
                <Button
                  variant={location.startsWith("/live") ? "secondary" : "ghost"}
                  className={`w-full justify-start px-4 py-3 text-foreground rounded-md mx-2 ${
                    location.startsWith("/live") ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleNavigation("/live")}
                >
                  <LiveIcon className="mr-3 h-5 w-5" />
                  <span>Live TV</span>
                </Button>
              </li>
              
              <li>
                <Button
                  variant={location.startsWith("/guide") ? "secondary" : "ghost"}
                  className={`w-full justify-start px-4 py-3 text-foreground rounded-md mx-2 ${
                    location.startsWith("/guide") ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleNavigation("/guide")}
                >
                  <GuideIcon className="mr-3 h-5 w-5" />
                  <span>TV Guide</span>
                </Button>
              </li>
              
              <li>
                <Button
                  variant={location.startsWith("/favorites") ? "secondary" : "ghost"}
                  className={`w-full justify-start px-4 py-3 text-foreground rounded-md mx-2 ${
                    location.startsWith("/favorites") ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => handleNavigation("/favorites")}
                >
                  <FavoriteIcon className="mr-3 h-5 w-5" />
                  <span>Favorites</span>
                </Button>
              </li>
            </ul>
            
            {categories && categories.length > 0 && (
              <>
                <div className="mt-6 px-4 py-2 font-medium text-muted-foreground uppercase text-xs tracking-wider">
                  Categories
                </div>
                
                <ul>
                  {categories.map((category: any) => (
                    <li key={category.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between px-4 py-3 text-muted-foreground hover:text-foreground rounded-md mx-2"
                        onClick={() => handleNavigation(`/live?category=${category.id}`)}
                      >
                        <span>{category.name}</span>
                        {/* We could add category channel count here if available */}
                      </Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            
            <div className="px-4 py-5 mt-4 bg-card mx-2 rounded-md">
              <h3 className="font-medium text-foreground mb-2">Playlist</h3>
              <div className="text-sm text-muted-foreground mb-3">
                {activePlaylist?.name || "No active playlist"}
              </div>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark mb-2"
                    size="sm"
                  >
                    <ImportIcon className="mr-2 h-4 w-4" />
                    Import Playlist
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <ImportPlaylist />
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="outline" 
                className="w-full"
                size="sm"
                onClick={() => handleNavigation("/playlists")}
              >
                <PlaylistIcon className="mr-2 h-4 w-4" />
                Manage Playlists
              </Button>
            </div>
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
