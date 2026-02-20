import type { Proposal } from "@/types/cfms";
import { StatusBadge } from "./StatusBadge";
import { RatingStars } from "./RatingStars";
import { Button } from "./ui/button";
import { Clock, DollarSign } from "lucide-react";

export const ProposalCard = ({
  proposal,
  showActions = false,
  onAccept,
  onReject,
}: {
  proposal: Proposal;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}) => (
  <div className="rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <img src={proposal.freelancer.avatar} alt={proposal.freelancer.name} className="h-11 w-11 rounded-xl bg-secondary object-cover" />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-card-foreground">{proposal.freelancer.name}</h4>
            <p className="truncate text-xs text-muted-foreground">
              {proposal.freelancer.branch || "Campus"}
              {proposal.freelancer.year ? ` • Year ${proposal.freelancer.year}` : ""}
            </p>
          </div>
          <StatusBadge status={proposal.status} className="shrink-0" />
        </div>

        <div className="mb-3 flex items-center gap-1">
          <RatingStars rating={proposal.freelancer.rating} size={12} />
          <span className="text-xs text-muted-foreground">({proposal.freelancer.rating})</span>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{proposal.approach}</p>

        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {proposal.timeline}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> ₹{proposal.quote}
          </span>
        </div>

        {showActions && proposal.status === "pending" ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept}>Accept</Button>
            <Button size="sm" variant="outline" onClick={onReject}>Reject</Button>
          </div>
        ) : null}
      </div>
    </div>
  </div>
);
