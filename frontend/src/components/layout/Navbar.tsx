import { useEffect, useState } from "react";
import { Bell, ArrowLeftRight, Loader2, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/types/cfms";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { ConnectionBadge } from "@/components/layout/ConnectionBadge";

type NavbarProps = {
  title: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
};

export const Navbar = ({ title, mobileOpen, onToggleMobile }: NavbarProps) => {
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
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onToggleMobile}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:text-foreground lg:hidden"
          aria-label="Toggle sidebar"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="display-font truncate text-lg font-semibold text-foreground sm:text-xl">{title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {user?.role === "poster" ? "Poster console" : "Freelancer console"}
          </p>
        </div>

        <div className="hidden lg:block">
          <ConnectionBadge compact />
        </div>

        <button
          onClick={handleSwitchRole}
          disabled={switchingRole}
          className="hidden items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:opacity-70 sm:inline-flex"
        >
          {switchingRole ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowLeftRight className="h-3.5 w-3.5" />}
          {user?.role === "poster" ? "Poster" : "Freelancer"}
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              ) : null}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[320px] border-border/70 p-0" align="end">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {notifications.length > 0 ? (
                <button onClick={markAllRead} className="text-xs font-semibold text-accent transition hover:text-accent/80">
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-border px-4 py-3 last:border-0 ${!notification.read ? "bg-accent/5" : ""}`}
                  >
                    <p className="text-sm font-semibold text-card-foreground">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{notification.time}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 transition hover:bg-secondary">
              <img
                src={user?.avatar || "https://api.dicebear.com/7.x/initials/svg?seed=CFMS"}
                alt={user?.name || "User avatar"}
                className="h-8 w-8 rounded-lg bg-secondary"
              />
              <span className="hidden text-sm font-semibold text-foreground md:block">{user?.name || "User"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="border-t border-border/70 px-4 py-2 lg:hidden">
        <ConnectionBadge />
      </div>
    </header>
  );
};
