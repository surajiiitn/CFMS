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
import { Calendar, DollarSign, ArrowLeft, Loader2, FileText, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    if (!job || !approach || !timeline || !quote) return;

    setSubmitting(true);
    try {
      await api.jobs.apply(job.id, {
        approach,
        timeline,
        quote: Number(quote),
      });
      toast({ title: "Proposal submitted", description: "Your proposal has been sent to the poster." });
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
      toast({ title: action === "accept" ? "Proposal accepted" : "Proposal rejected" });

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
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">Loading job details...</div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout title="Job Not Found">
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
          <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground/45" />
          <p className="text-muted-foreground">{error || "This job does not exist."}</p>
          <Link to="/jobs" className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accent/80">
            Back to Jobs
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const canApply = user?.role === "freelancer" && !isPoster && job.status === "open";

  return (
    <DashboardLayout title="Job Details">
      <Link to="/jobs" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Jobs
      </Link>

      {error ? (
        <div className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h2 className="display-font text-2xl font-semibold text-card-foreground">{job.title}</h2>
              <StatusBadge status={job.status} />
            </div>

            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{job.description}</p>

            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-card-foreground">Required skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-secondary-foreground/15 bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-card-foreground">Deliverables</h3>
                <p className="text-sm text-muted-foreground">{job.deliverables || "No deliverables specified."}</p>
              </div>
            </div>
          </section>

          {isPoster && job.applicants.length > 0 ? (
            <section>
              <h3 className="mb-4 display-font text-xl font-semibold text-foreground">Proposals ({job.applicants.length})</h3>
              <div className="space-y-4">
                {job.applicants.map((proposal) => (
                  <ProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    showActions
                    onAccept={() => handleProposalAction(proposal.id, "accept")}
                    onReject={() => handleProposalAction(proposal.id, "reject")}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Budget</span>
                <span className="ml-auto font-semibold text-card-foreground">₹{job.budget}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline</span>
                <span className="ml-auto font-semibold text-card-foreground">{job.deadline}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">Posted by</p>
              <div className="mt-2 flex items-center gap-2.5">
                {job.poster.avatar ? (
                  <img src={job.poster.avatar} alt="Poster avatar" className="h-9 w-9 rounded-xl bg-secondary object-cover" />
                ) : (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                    <UserRound className="h-4 w-4" />
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{job.poster.name}</p>
                  <p className="text-xs text-muted-foreground">{job.poster.branch || "Campus student"}</p>
                </div>
              </div>
            </div>

            {canApply ? (
              <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogTrigger asChild>
                  <Button className="mt-5 w-full">Apply Now</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Proposal</DialogTitle>
                  </DialogHeader>
                  <div className="mt-2 space-y-4">
                    <div className="space-y-2">
                      <Label>Your approach</Label>
                      <Textarea
                        placeholder="Explain how you will complete the task"
                        value={approach}
                        onChange={(e) => setApproach(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Timeline</Label>
                      <Input placeholder="e.g., 7 days" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Quote (₹)</Label>
                      <Input type="number" placeholder="Your quote" value={quote} onChange={(e) => setQuote(e.target.value)} />
                    </div>
                    <Button onClick={handleApply} className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Submitting
                        </>
                      ) : (
                        "Submit Proposal"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
};

export default JobDetails;
