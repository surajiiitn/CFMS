import { useEffect, useState } from "react";
import { Bell, ChevronDown, ArrowLeftRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types/cfms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

export const Navbar = ({ title }: { title: string }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [switchingRole, setSwitchingRole] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch {
      setNotifications([]);
      setUnread(0);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const interval = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(interval);
  }, [user?.id]);

  const markAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch {
      // no-op
    }
  };

  const handleSwitchRole = async () => {
    setSwitchingRole(true);
    try {
      await switchRole();
    } finally {
      setSwitchingRole(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSwitchRole}
          disabled={switchingRole}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-70"
        >
          {switchingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
          {user?.role === "poster" ? "Poster" : "Freelancer"}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 ${!n.read ? "bg-accent/5" : ""}`}>
                    <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors">
              <img src={user?.avatar} alt="" className="h-8 w-8 rounded-full bg-secondary" />
              <span className="hidden sm:block text-sm font-medium text-foreground">{user?.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
