import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { JobCard } from "@/components/JobCard";
import { api } from "@/lib/api";
import type { Job } from "@/types/cfms";
import type { LucideIcon } from "lucide-react";
import { Briefcase, IndianRupee, CheckCircle, Clock, FileText, TrendingUp, Sparkles } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color: string }) => (
  <div className="rounded-2xl border border-border/70 bg-card/95 p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">{label}</p>
        <p className="display-font text-2xl font-bold text-card-foreground">{value}</p>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.dashboard.summary();
        setStats(data.stats);
        setRecentJobs(data.recentJobs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.role]);

  const isPoster = user?.role === "poster";

  const statCards = useMemo(
    () =>
      isPoster
        ? [
            { icon: Briefcase, label: "Jobs Posted", value: String(stats.jobsPosted || 0), color: "bg-accent/15 text-accent" },
            { icon: FileText, label: "Proposals", value: String(stats.proposalsCount || 0), color: "bg-primary/10 text-primary" },
            { icon: Clock, label: "Active", value: String(stats.active || 0), color: "bg-warning/10 text-warning" },
            { icon: CheckCircle, label: "Completed", value: String(stats.completed || 0), color: "bg-success/10 text-success" },
          ]
        : [
            { icon: Briefcase, label: "Open Jobs", value: String(stats.availableJobs || 0), color: "bg-accent/15 text-accent" },
            { icon: FileText, label: "My Proposals", value: String(stats.myProposals || 0), color: "bg-primary/10 text-primary" },
            { icon: TrendingUp, label: "Active Gigs", value: String(stats.activeGigs || 0), color: "bg-warning/10 text-warning" },
            { icon: IndianRupee, label: "Earned", value: `₹${stats.earned || 0}`, color: "bg-success/10 text-success" },
          ],
    [isPoster, stats]
  );

  return (
    <DashboardLayout title="Dashboard">
      <section className="mb-7 overflow-hidden rounded-3xl border border-primary/20 bg-primary px-6 py-7 text-primary-foreground shadow-xl sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="display-font text-2xl font-bold">Welcome, {user?.name}</h2>
            <p className="text-sm text-primary-foreground/80">
              {isPoster
                ? "Track job responses and move accepted work into workspace."
                : "Discover opportunities and keep active gigs on schedule."}
            </p>
          </div>
          <span className="ml-auto rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.03em]">
            {isPoster ? "Poster Mode" : "Freelancer Mode"}
          </span>
        </div>
      </section>

      {error ? (
        <div className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="display-font text-xl font-semibold text-foreground">
            {isPoster ? "Recent jobs" : "Recommended jobs"}
          </h3>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">Loading jobs...</div>
        ) : recentJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">
            No jobs available yet.
          </div>
        )}
      </section>
    </DashboardLayout>
  );
};

export default Dashboard;
