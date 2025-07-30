
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import Toolbar from "./toolbar";
import Sidebar from "./sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        {/* Desktop Sidebar - sempre visível */}
        {!isMobile && (
          <div className="w-64 fixed left-0 top-16 h-[calc(100vh-4rem)] z-30">
            <Sidebar onClose={() => {}} />
          </div>
        )}

        {/* Mobile Sidebar - modal */}
        {isMobile && sidebarOpen && (
          <>
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ease-in-out">
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        <main className={`flex-1 p-4 md:p-6 mt-16 transition-all duration-300 ${!isMobile ? 'ml-64' : ''} min-w-0`}>
          <div className="fade-in max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
