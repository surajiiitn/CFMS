import { Calendar, DollarSign, Users } from "lucide-react";
import type { Job } from "@/types/cfms";
import { StatusBadge } from "./StatusBadge";
import { Link } from "react-router-dom";

export const JobCard = ({ job }: { job: Job }) => (
  <Link to={`/jobs/${job.id}`} className="block">
    <div className="rounded-xl border border-border bg-card p-5 card-hover cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-card-foreground line-clamp-1">{job.title}</h3>
        <StatusBadge status={job.status} />
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {job.skills.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {skill}
          </span>
        ))}
        {job.skills.length > 3 && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            +{job.skills.length - 3}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5" />₹{job.budget}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />{job.deadline}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />{job.applicantsCount} applied
        </span>
      </div>
    </div>
  </Link>
);
