import { Calendar, IndianRupee, Users, ArrowUpRight } from "lucide-react";
import type { Job } from "@/types/cfms";
import { StatusBadge } from "./StatusBadge";
import { Link } from "react-router-dom";

export const JobCard = ({ job }: { job: Job }) => (
  <Link to={`/jobs/${job.id}`} className="block">
    <article className="card-hover h-full rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="display-font line-clamp-2 text-base font-semibold text-card-foreground">{job.title}</h3>
        <StatusBadge status={job.status} className="shrink-0" />
      </div>

      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{job.description}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {job.skills.slice(0, 4).map((skill) => (
          <span
            key={skill}
            className="rounded-full border border-secondary-foreground/15 bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground"
          >
            {skill}
          </span>
        ))}
        {job.skills.length > 4 ? (
          <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            +{job.skills.length - 4}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5" /> ₹{job.budget}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />{job.deadline}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />{job.applicantsCount} applied
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-accent">
          View <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  </Link>
);
