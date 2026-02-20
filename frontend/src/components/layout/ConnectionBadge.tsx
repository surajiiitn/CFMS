import { Loader2, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnection } from "@/context/ConnectionContext";

const statusMap = {
  connected: {
    label: "Live",
    className: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
  degraded: {
    label: "Reconnecting",
    className: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  offline: {
    label: "Offline",
    className: "border-destructive/25 bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
} as const;

export const ConnectionBadge = ({ compact = false }: { compact?: boolean }) => {
  const { status, checking } = useConnection();
  const meta = statusMap[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        meta.className
      )}
      title="Backend connection status"
    >
      <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
      {checking ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : status === "connected" ? (
        <Wifi className="h-3 w-3" aria-hidden />
      ) : (
        <WifiOff className="h-3 w-3" aria-hidden />
      )}
      {!compact && <span>{meta.label}</span>}
    </div>
  );
};
