import { ReactNode, useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useMobile();
  const [location] = useLocation();
  
  // Verificar si estamos en la página de configuración
  const isSetupPage = location === "/setup";
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };
  
  // Si estamos en la página de configuración, mostrar solo el contenido sin el layout
  if (isSetupPage) {
    return (
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    );
  }
  
  // Si no, mostrar el layout completo con header y sidebar
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
