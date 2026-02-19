import { useState, ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

export const DashboardLayout = ({ title, children }: { title: string; children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={cn("transition-all duration-300", collapsed ? "ml-16" : "ml-60")}>
        <Navbar title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};
