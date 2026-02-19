import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { ProposalCard } from "@/components/ProposalCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Job } from "@/types/cfms";
import { Calendar, DollarSign, ArrowLeft, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [approach, setApproach] = useState("");
  const [timeline, setTimeline] = useState("");
  const [quote, setQuote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadJob = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");
    try {
      const data = await api.jobs.getById(id);
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  const isPoster = Boolean(job && user?.id === job.poster.id);

  const handleApply = async () => {
    if (!job) return;
    if (!approach || !timeline || !quote) return;

    setSubmitting(true);
    try {
      await api.jobs.apply(job.id, {
        approach,
        timeline,
        quote: Number(quote),
      });
      toast({ title: "Proposal Submitted", description: "Your proposal has been sent to the poster." });
      setApproach("");
      setTimeline("");
      setQuote("");
      setApplyOpen(false);
      loadJob();
    } catch (err) {
      toast({
        title: "Unable to submit proposal",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposalAction = async (proposalId: string, action: "accept" | "reject") => {
    if (!job) return;

    try {
      const data = await api.jobs.updateProposalStatus(job.id, proposalId, action);
      toast({ title: action === "accept" ? "Proposal Accepted" : "Proposal Rejected" });

      if (action === "accept" && data.workspaceId) {
        navigate(`/workspace/${data.workspaceId}`);
        return;
      }

      loadJob();
    } catch (err) {
      toast({
        title: "Unable to update proposal",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Job Details">
        <p className="text-sm text-muted-foreground">Loading job...</p>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout title="Job Not Found">
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{error || "This job doesn't exist."}</p>
          <Link to="/jobs" className="mt-4 text-accent hover:underline text-sm">Back to Jobs</Link>
        </div>
      </DashboardLayout>
    );
  }

  const canApply = user?.role === "freelancer" && !isPoster && job.status === "open";

  return (
    <DashboardLayout title="Job Details">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />Back to Jobs
        </Link>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-card-foreground">{job.title}</h2>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">{job.description}</p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((s) => (
                      <span key={s} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground mb-1">Deliverables</h3>
                  <p className="text-sm text-muted-foreground">{job.deliverables || "No deliverables specified."}</p>
                </div>
              </div>
            </div>

            {isPoster && job.applicants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4">Proposals ({job.applicants.length})</h3>
                <div className="space-y-4">
                  {job.applicants.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      showActions
                      onAccept={() => handleProposalAction(p.id, "accept")}
                      onReject={() => handleProposalAction(p.id, "reject")}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Budget</span>
                <span className="ml-auto font-semibold text-card-foreground">₹{job.budget}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline</span>
                <span className="ml-auto font-semibold text-card-foreground">{job.deadline}</span>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-1">Posted by</p>
                <div className="flex items-center gap-2">
                  <img src={job.poster.avatar} alt="" className="h-8 w-8 rounded-full bg-secondary" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{job.poster.name}</p>
                    <p className="text-xs text-muted-foreground">{job.poster.branch || "Campus Student"}</p>
                  </div>
                </div>
              </div>

              {canApply && (
                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Apply Now</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Proposal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Your Approach</Label>
                        <Textarea placeholder="Describe how you'll complete this job..." value={approach} onChange={(e) => setApproach(e.target.value)} rows={4} />
                        <p className="text-xs text-muted-foreground text-right">{approach.length}/500</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Timeline</Label>
                        <Input placeholder="e.g., 7 days" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Your Quote (₹)</Label>
                        <Input type="number" placeholder="Enter your price" value={quote} onChange={(e) => setQuote(e.target.value)} />
                      </div>
                      <Button onClick={handleApply} className="w-full" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...
                          </>
                        ) : (
                          "Submit Proposal"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default JobDetails;
