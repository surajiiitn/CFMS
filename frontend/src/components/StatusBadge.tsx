import { cn } from "@/lib/utils";

type Status = "open" | "assigned" | "in-progress" | "submitted" | "completed" | "pending" | "accepted" | "rejected";

const statusStyles: Record<Status, string> = {
  open: "border-accent/35 bg-accent/10 text-accent",
  assigned: "border-primary/30 bg-primary/10 text-primary",
  "in-progress": "border-warning/35 bg-warning/10 text-warning",
  submitted: "border-accent/35 bg-accent/10 text-accent",
  completed: "border-success/35 bg-success/10 text-success",
  pending: "border-warning/35 bg-warning/10 text-warning",
  accepted: "border-success/35 bg-success/10 text-success",
  rejected: "border-destructive/35 bg-destructive/10 text-destructive",
};

const statusLabels: Record<Status, string> = {
  open: "Open",
  assigned: "Assigned",
  "in-progress": "In Progress",
  submitted: "Submitted",
  completed: "Completed",
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
};

export const StatusBadge = ({ status, className }: { status: Status; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.03em]",
      statusStyles[status],
      className
    )}
  >
    {statusLabels[status]}
  </span>
);
