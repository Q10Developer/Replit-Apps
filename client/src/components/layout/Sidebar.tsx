import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, Upload, Users, Settings, 
  BarChart2, FileText
} from "lucide-react";

interface SidebarProps {
  collapsed?: boolean;
}

const Sidebar = ({ collapsed = false }: SidebarProps) => {
  const [location] = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/", icon: Home },
    { name: "Upload CVs", path: "/upload", icon: Upload },
    { name: "Candidates", path: "/candidates", icon: Users },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Reports", path: "/reports", icon: BarChart2 },
  ];

  return (
    <aside className="bg-white border-r border-gray-200 w-64 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="bg-primary text-white rounded p-1 mr-3">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="font-bold text-xl text-gray-800">CV Smart Hire</h1>
        </div>
      </div>
      <nav className="p-2">
        <ul>
          {navItems.map((item) => (
            <li key={item.path} className="mb-1">
              <Link href={item.path}>
                <a
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-md",
                    location === item.path
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {!collapsed && <span>{item.name}</span>}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-200 mt-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700">
            <span className="font-medium text-sm">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Jane Doe</p>
            <p className="text-xs text-gray-500">HR Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
