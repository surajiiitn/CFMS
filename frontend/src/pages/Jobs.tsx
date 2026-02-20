import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Job } from "@/types/cfms";
import { Search, SlidersHorizontal, X, BriefcaseBusiness } from "lucide-react";

const statusFilters = ["All", "open", "assigned", "in-progress", "completed"] as const;

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadJobs = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await api.jobs.list({
          search: search || undefined,
          status: statusFilter === "All" ? undefined : statusFilter,
          skills: selectedSkills.length ? selectedSkills.join(",") : undefined,
          page,
          limit: 12,
        });

        setJobs(data.items);
        setTotalPages(data.pagination.totalPages || 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [search, selectedSkills, statusFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedSkills, statusFilter]);

  const allSkills = useMemo(() => {
    const skillSet = new Set<string>();
    jobs.forEach((job) => job.skills.forEach((skill) => skillSet.add(skill)));
    return Array.from(skillSet);
  }, [jobs]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  return (
    <DashboardLayout title="Browse Jobs">
      <section className="mb-6 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, skill, or keyword"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button variant="outline" onClick={() => setShowFilters((prev) => !prev)} className="shrink-0">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {selectedSkills.length > 0 || statusFilter !== "All" ? (
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                {selectedSkills.length + (statusFilter !== "All" ? 1 : 0)}
              </span>
            ) : null}
          </Button>
        </div>

        {showFilters ? (
          <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Active filters</h3>
              <button
                onClick={() => {
                  setSelectedSkills([]);
                  setStatusFilter("All");
                }}
                className="text-xs font-semibold text-accent transition hover:text-accent/80"
              >
                Clear all
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">Status</p>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      statusFilter === status
                        ? "border-accent/30 bg-accent/10 text-accent"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {status === "All" ? "All" : status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">Skills</p>
              <div className="flex flex-wrap gap-2">
                {allSkills.length > 0 ? (
                  allSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        selectedSkills.includes(skill)
                          ? "border-accent/30 bg-accent/10 text-accent"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {skill}
                      {selectedSkills.includes(skill) ? <X className="ml-1 inline h-3 w-3" /> : null}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Skills will appear once jobs are loaded.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">Loading jobs...</div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <p>
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
            </p>
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              CFMS Listings
            </div>
          </div>

          {jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground/45" />
              <h3 className="display-font text-lg font-semibold text-foreground">No jobs found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try changing your filters or search keywords.</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Jobs;
