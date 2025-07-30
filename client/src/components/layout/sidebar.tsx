
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BarChart3,
  Users,
  Receipt,
  UserCheck,
  FileText,
  DollarSign,
  ChartBar,
  X,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    roles: ["admin", "collector"],
  },
  {
    title: "Usuários",
    href: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Despesas",
    href: "/expenses",
    icon: Receipt,
    roles: ["admin", "collector"],
  },
  {
    title: "Clientes",
    href: "/clients",
    icon: UserCheck,
    roles: ["admin", "collector"],
  },
  {
    title: "Contratos",
    href: "/contracts",
    icon: FileText,
    roles: ["admin", "collector"],
  },
  {
    title: "Cobranças",
    href: "/collections",
    icon: DollarSign,
    roles: ["admin", "collector"],
  },
  {
    title: "Relatórios",
    href: "/reports",
    icon: ChartBar,
    roles: ["admin"],
  },
];

interface SidebarProps {
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role || "")
  );

  return (
    <aside className="h-full w-full bg-white border-r border-gray-200 shadow-lg">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">SC</span>
            </div>
            <span className="text-lg md:text-xl font-bold text-gray-900 truncate">Sistema Cobrança</span>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || (location === "/" && item.href === "/dashboard");

              return (
                <li key={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-12 px-4 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 ease-in-out",
                      isActive && "bg-blue-50 text-blue-700 border-r-2 border-blue-700 hover:bg-blue-50"
                    )}
                    onClick={() => {
                      setLocation(item.href);
                      if (isMobile) onClose();
                    }}
                  >
                    <Icon className={cn(
                      "h-5 w-5 mr-3 transition-colors duration-200",
                      isActive ? "text-blue-700" : "text-gray-500"
                    )} />
                    <span className="truncate">{item.title}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            v1.0.0
          </div>
        </div>
      </div>
    </aside>
  );
}
