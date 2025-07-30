import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, LogOut, User } from "lucide-react";

interface ToolbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Toolbar({ sidebarOpen, setSidebarOpen }: ToolbarProps) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-2 md:px-4 h-16 min-w-0">
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {!isMobile && (
            <div className="text-lg font-semibold text-gray-900 truncate">
              Dashboard
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 md:space-x-3 min-w-0">
          <div className="flex items-center space-x-1 md:space-x-2 text-sm text-gray-600 min-w-0">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{user?.name}</span>
            <span className="text-xs bg-gray-100 px-1 md:px-2 py-1 rounded-full flex-shrink-0">
              {user?.role === 'admin' ? 'Admin' : 'Coletor'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}