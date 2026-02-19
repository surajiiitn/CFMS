import { cn } from "@/lib/utils";

type Status = "open" | "assigned" | "in-progress" | "submitted" | "completed" | "pending" | "accepted" | "rejected";

const statusStyles: Record<Status, string> = {
  open: "bg-accent/10 text-accent",
  assigned: "bg-primary/10 text-primary",
  "in-progress": "bg-warning/10 text-warning",
  submitted: "bg-accent/15 text-accent",
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
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
  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[status], className)}>
    {statusLabels[status]}
  </span>
);
