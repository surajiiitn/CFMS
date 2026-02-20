import { useState, type ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

export const DashboardLayout = ({ title, children }: { title: string; children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen app-shell-bg">
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-primary/30 backdrop-blur-sm lg:hidden"
          aria-label="Close sidebar"
        />
      ) : null}

      <div className={cn("min-h-screen transition-all duration-300", collapsed ? "lg:ml-24" : "lg:ml-72")}>
        <Navbar title={title} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((prev) => !prev)} />

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl page-enter">{children}</div>
        </main>
      </div>
    </div>
  );
};
