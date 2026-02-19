import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { JobCard } from "@/components/JobCard";
import { api } from "@/lib/api";
import type { Job } from "@/types/cfms";
import { Briefcase, DollarSign, CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
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
            { icon: Briefcase, label: "Jobs Posted", value: String(stats.jobsPosted || 0), color: "bg-accent/10 text-accent" },
            { icon: FileText, label: "Proposals", value: String(stats.proposalsCount || 0), color: "bg-primary/10 text-primary" },
            { icon: Clock, label: "Active", value: String(stats.active || 0), color: "bg-warning/10 text-warning" },
            { icon: CheckCircle, label: "Completed", value: String(stats.completed || 0), color: "bg-success/10 text-success" },
          ]
        : [
            { icon: Briefcase, label: "Available Jobs", value: String(stats.availableJobs || 0), color: "bg-accent/10 text-accent" },
            { icon: FileText, label: "My Proposals", value: String(stats.myProposals || 0), color: "bg-primary/10 text-primary" },
            { icon: TrendingUp, label: "Active Gigs", value: String(stats.activeGigs || 0), color: "bg-warning/10 text-warning" },
            { icon: DollarSign, label: "Earned", value: `₹${stats.earned || 0}`, color: "bg-success/10 text-success" },
          ],
    [isPoster, stats]
  );

  return (
    <DashboardLayout title="Dashboard">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <p className="text-muted-foreground mb-6">
          Welcome back, <span className="font-medium text-foreground">{user?.name}</span>
          <span className="ml-2 inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            {isPoster ? "Job Poster" : "Freelancer"}
          </span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {isPoster ? "Your Recent Jobs" : "Available Jobs"}
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading jobs...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
