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
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-start gap-4">
      <img src={proposal.freelancer.avatar} alt={proposal.freelancer.name} className="h-10 w-10 rounded-full bg-secondary" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h4 className="font-semibold text-card-foreground">{proposal.freelancer.name}</h4>
            <p className="text-xs text-muted-foreground">
              {proposal.freelancer.branch || "Campus"}
              {proposal.freelancer.year ? ` • Year ${proposal.freelancer.year}` : ""}
            </p>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
        <div className="flex items-center gap-1 mb-2">
          <RatingStars rating={proposal.freelancer.rating} size={12} />
          <span className="text-xs text-muted-foreground">({proposal.freelancer.rating})</span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{proposal.approach}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{proposal.timeline}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />₹{proposal.quote}</span>
        </div>
        {showActions && proposal.status === "pending" && (
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept}>Accept</Button>
            <Button size="sm" variant="outline" onClick={onReject}>Reject</Button>
          </div>
        )}
      </div>
    </div>
  </div>
);
