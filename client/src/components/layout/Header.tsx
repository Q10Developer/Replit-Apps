import { 
  Bell, 
  Search as SearchIcon, 
  Menu as MenuIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Fetch notifications
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Count unread notifications
  const unreadCount = notifications?.filter((n: any) => !n.read).length || 0;
  
  // Handle notification click
  const handleNotificationClick = () => {
    if (unreadCount > 0) {
      toast({
        title: "New Notifications",
        description: `You have ${unreadCount} unread notifications`,
      });
    }
  };
  
  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="text-gray-500 hover:text-gray-600"
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="max-w-lg w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search candidates"
                  className="block w-full pl-10 pr-3 py-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="ml-4 flex items-center md:ml-6">
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={handleNotificationClick}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5 text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
