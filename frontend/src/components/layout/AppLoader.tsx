import { Loader2 } from "lucide-react";

export const AppLoader = ({
  title = "Loading workspace",
  subtitle = "Syncing with backend services",
}: {
  title?: string;
  subtitle?: string;
}) => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 app-shell-bg">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-8 text-center shadow-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h2 className="display-font text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
};
