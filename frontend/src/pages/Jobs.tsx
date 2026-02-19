import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCard } from "@/components/JobCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Job } from "@/types/cfms";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { motion } from "framer-motion";

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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="shrink-0">
            <SlidersHorizontal className="mr-2 h-4 w-4" />Filters
            {(selectedSkills.length > 0 || statusFilter !== "All") && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] text-accent-foreground">
                {selectedSkills.length + (statusFilter !== "All" ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-5 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-card-foreground">Filters</h3>
              <button
                onClick={() => {
                  setSelectedSkills([]);
                  setStatusFilter("All");
                }}
                className="text-xs text-accent hover:underline"
              >
                Clear all
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      statusFilter === s
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedSkills.includes(skill)
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {skill}
                    {selectedSkills.includes(skill) && <X className="ml-1 inline h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading jobs...</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
            </p>
            {jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-foreground mb-1">No jobs found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Jobs;
