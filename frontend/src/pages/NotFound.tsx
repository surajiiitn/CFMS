import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 app-shell-bg">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-border/70 p-8 text-center shadow-xl">
        <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/10 text-warning">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="display-font mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-5 text-sm text-muted-foreground">This page does not exist or the link is outdated.</p>
        <a href="/" className="text-sm font-semibold text-accent transition hover:text-accent/80">
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
