import { ReactNode, useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMobile();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={isMobile ? isSidebarOpen : true} onClose={closeSidebar} />
        
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${
          isMobile && isSidebarOpen ? 'opacity-40' : 'opacity-100'
        }`} onClick={isMobile && isSidebarOpen ? closeSidebar : undefined}>
          {children}
        </main>
      </div>
    </div>
  );
}
