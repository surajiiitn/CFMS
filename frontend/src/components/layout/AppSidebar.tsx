import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  FolderKanban,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  {
    label: "Dashboard",
    description: "Overview",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Browse Jobs",
    description: "Find gigs",
    icon: Search,
    path: "/jobs",
  },
  {
    label: "Post Job",
    description: "Create listing",
    icon: PlusCircle,
    path: "/create-job",
  },
  {
    label: "Workspace",
    description: "Live progress",
    icon: FolderKanban,
    path: "/workspace",
  },
  {
    label: "Profile",
    description: "Your account",
    icon: User,
    path: "/profile",
  },
] as const;

type AppSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
};

export const AppSidebar = ({ collapsed, mobileOpen, onToggle, onCloseMobile }: AppSidebarProps) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-screen border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-2xl transition-all duration-300",
        collapsed ? "w-24" : "w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-sidebar-border/70 px-4 pb-4 pt-5">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}> 
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20">
                <GraduationCap className="h-5 w-5" />
              </div>
              {!collapsed ? (
                <div>
                  <p className="display-font text-base font-semibold tracking-tight">CFMS</p>
                  <p className="text-xs text-sidebar-foreground/70">Campus Freelance</p>
                </div>
              ) : null}
            </div>
            {!collapsed ? (
              <button
                type="button"
                onClick={onToggle}
                className="hidden rounded-lg p-2 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="mt-3 hidden w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:inline-flex"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed ? (
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{item.label}</p>
                    <p className="truncate text-xs text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground/75">
                      {item.description}
                    </p>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border/70 p-3">
          {!collapsed ? (
            <div className="mb-3 rounded-xl border border-sidebar-border/80 bg-sidebar-accent/60 px-3 py-2">
              <p className="truncate text-sm font-semibold">{user?.name || "User"}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">{user?.role === "poster" ? "Job Poster" : "Freelancer"}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-sidebar-foreground/75 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>Logout</span> : null}
          </button>
        </div>
      </div>
    </aside>
  );
};
