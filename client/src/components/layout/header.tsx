import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  TVIcon,
} from "@/components/ui/icons";
import { APP_NAME } from "@/lib/constants";
import { useMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import SettingsDialog from "@/components/dialogs/settings-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const isMobile = useMobile();
  const [location, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/live?search=${encodeURIComponent(searchTerm)}`);
      setIsSearchOpen(false);
    }
  };
  
  const handleOpenSearch = () => {
    setIsSearchOpen(true);
  };
  
  return (
    <header className="bg-muted border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden text-muted-foreground hover:text-foreground focus-visible"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
        )}
        
        <a href="#" 
           className="focus-visible text-foreground font-bold text-xl md:text-2xl flex items-center"
           onClick={(e) => {
             e.preventDefault();
             navigate("/");
           }}
        >
          <TVIcon className="text-primary mr-2 h-6 w-6 md:h-7 md:w-7" />
          <span>{APP_NAME}</span>
        </a>
      </div>
      
      <div className="hidden md:flex items-center space-x-4">
        {!isSearchOpen ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleOpenSearch}
            className="flex items-center"
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            <span>Search</span>
          </Button>
        ) : (
          <form onSubmit={handleSearch} className="flex items-center">
            <Input
              type="text"
              placeholder="Search channels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 mr-2"
              autoFocus
            />
            <Button 
              type="submit" 
              size="sm"
              variant="secondary"
            >
              Search
            </Button>
            <Button 
              type="button" 
              size="sm"
              variant="ghost"
              onClick={() => setIsSearchOpen(false)}
              className="ml-1"
            >
              Cancel
            </Button>
          </form>
        )}
        
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center"
            >
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <SettingsDialog />
          </DialogContent>
        </Dialog>
      </div>
      
      {isMobile && (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenSearch}
            className="text-muted-foreground hover:text-foreground focus-visible"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground focus-visible"
                aria-label="Settings"
              >
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <SettingsDialog />
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {isMobile && isSearchOpen && (
        <div className="fixed inset-0 bg-background/80 z-50 flex items-start justify-center pt-16 px-4">
          <div className="bg-card rounded-lg p-4 w-full max-w-md">
            <form onSubmit={handleSearch} className="flex flex-col space-y-4">
              <Input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsSearchOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="secondary">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
