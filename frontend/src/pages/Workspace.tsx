import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage } from "@/components/ChatMessage";
import { RatingStars } from "@/components/RatingStars";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api, HttpError } from "@/lib/api";
import { connectSocket, getSocket, joinWorkspaceRoom, leaveWorkspaceRoom, sendWorkspaceSocketMessage } from "@/lib/socket";
import type { ChatMsg, Workspace as WorkspaceType } from "@/types/cfms";
import { useToast } from "@/hooks/use-toast";
import { Send, Link2, Upload, Plus, Calendar, IndianRupee, CheckCircle2, FolderOpen, RotateCcw, Loader2, Clock3 } from "lucide-react";

const formatDuration = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.slice(0, 3).join(" ");
};

const Workspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const [workspace, setWorkspace] = useState<WorkspaceType | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [message, setMessage] = useState("");
  const [newLink, setNewLink] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [error, setError] = useState("");

  const refreshWorkspace = useCallback(async (workspaceId: string) => {
    const data = await api.workspaces.getById(workspaceId);
    setWorkspace(data.workspace);
    setMessages(data.messages);
    setSubmissionLink(data.workspace.submission?.link || "");
    setSubmissionNotes(data.workspace.submission?.notes || "");
  }, []);

  useEffect(() => {
    const timer = globalThis.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        if (id) {
          await refreshWorkspace(id);
          try {
            await api.workspaces.start(id);
          } catch {
            // ignore if already started/completed
          }
          return;
        }

        const list = await api.workspaces.listMine();

        if (list.workspaces.length === 0) {
          setWorkspace(null);
          setMessages([]);
          setLoading(false);
          return;
        }

        navigate(`/workspace/${list.workspaces[0].id}`, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load workspace");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [id, navigate, refreshWorkspace]);

  useEffect(() => {
    const isWorkspaceActive =
      workspace?.status === "Active" && workspace?.job?.status !== "completed";

    if (!id || !token || !isWorkspaceActive) return;

    const socket = connectSocket(token);

    const joinCurrentRoom = () => {
      joinWorkspaceRoom(id).catch(() => {
        setError("Unable to connect live chat. Retrying...");
      });
    };

    joinCurrentRoom();

    const onSocketConnect = () => {
      joinCurrentRoom();
      setError("");
    };

    const onNewMessage = (incoming: ChatMsg) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === incoming.id)) return prev;
        return [...prev, incoming];
      });
    };

    const onSubmitted = () => {
      refreshWorkspace(id).catch(() => null);
    };

    const onReopened = () => {
      refreshWorkspace(id).catch(() => null);
    };

    const onCompleted = () => {
      refreshWorkspace(id).catch(() => null);
      toast({
        title: "Project completed",
        description: "Workspace is now closed. You can submit a rating below.",
      });
    };

    socket.on("connect", onSocketConnect);
    socket.on("workspace:message:new", onNewMessage);
    socket.on("workspace:submitted", onSubmitted);
    socket.on("workspace:reopened", onReopened);
    socket.on("workspace:completed", onCompleted);

    return () => {
      const activeSocket = getSocket();
      activeSocket?.off("connect", onSocketConnect);
      activeSocket?.off("workspace:message:new", onNewMessage);
      activeSocket?.off("workspace:submitted", onSubmitted);
      activeSocket?.off("workspace:reopened", onReopened);
      activeSocket?.off("workspace:completed", onCompleted);
      leaveWorkspaceRoom(id);
    };
  }, [id, token, workspace?.status, workspace?.job?.status, refreshWorkspace, toast]);

  useEffect(() => {
    setRating(0);
    setRatingComment("");
  }, [workspace?.id]);

  const sendMessage = async () => {
    if (!id || !message.trim()) return;

    setSending(true);
    try {
      await sendWorkspaceSocketMessage(id, message.trim());
      setMessage("");
      setError("");
    } catch {
      try {
        await api.workspaces.sendMessage(id, message.trim());
        setMessage("");
        await refreshWorkspace(id);
      } catch (err) {
        toast({
          title: "Unable to send message",
          description: err instanceof Error ? err.message : "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setSending(false);
    }
  };

  const addLink = async () => {
    if (!id || !newLink.trim()) return;

    try {
      await api.workspaces.addResource(id, newLink.trim());
      setNewLink("");
      setShowAddLink(false);
      await refreshWorkspace(id);
    } catch (err) {
      toast({
        title: "Unable to add resource",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const submitWork = async () => {
    if (!id || !submissionLink.trim()) {
      toast({
        title: "Submission link required",
        description: "Please add a valid submission URL",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.workspaces.submit(id, {
        link: submissionLink.trim(),
        notes: submissionNotes.trim(),
      });
      toast({ title: "Work submitted", description: "Your work has been submitted for review." });
      await refreshWorkspace(id);
    } catch (err) {
      toast({
        title: "Unable to submit work",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const approveSubmission = async () => {
    if (!id) return;

    setApproving(true);
    try {
      await api.workspaces.approve(id);
      toast({ title: "Submission approved", description: "Job marked as completed." });
      await refreshWorkspace(id);
    } catch (err) {
      toast({
        title: "Unable to approve",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const requestChanges = async () => {
    if (!id) return;

    setRequestingChanges(true);
    try {
      await api.workspaces.reopen(id);
      toast({ title: "Changes requested", description: "Workspace moved back to development." });
      await refreshWorkspace(id);
    } catch (err) {
      toast({
        title: "Unable to request changes",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setRequestingChanges(false);
    }
  };

  const submitRating = async () => {
    if (!id || !workspace) return;

    if (rating < 1 || rating > 5) {
      toast({
        title: "Rating required",
        description: "Please select a rating from 1 to 5.",
        variant: "destructive",
      });
      return;
    }

    const toUserId = isPoster ? workspace.freelancer.id : workspace.poster.id;
    setSubmittingRating(true);
    try {
      await api.workspaces.review(id, {
        toUserId,
        rating,
        comment: ratingComment.trim(),
      });
      toast({ title: "Rating submitted", description: "Thanks for sharing your feedback." });
      navigate("/workspace", { replace: true });
    } catch (err) {
      if (err instanceof HttpError && err.status === 409) {
        toast({ title: "Rating already submitted", description: "This workspace has already been rated and closed." });
        navigate("/workspace", { replace: true });
        return;
      }

      toast({
        title: "Unable to submit rating",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmittingRating(false);
    }
  };

  const isFreelancer = useMemo(
    () => Boolean(workspace && user && workspace.freelancer.id === user.id),
    [workspace, user]
  );

  const isPoster = useMemo(
    () => Boolean(workspace && user && workspace.poster.id === user.id),
    [workspace, user]
  );

  if (loading) {
    return (
      <DashboardLayout title="Workspace">
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-sm text-muted-foreground">Loading workspace...</div>
      </DashboardLayout>
    );
  }

  if (!workspace) {
    return (
      <DashboardLayout title="Workspace">
        <div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
          <FolderOpen className="mx-auto mb-4 h-10 w-10 text-muted-foreground/45" />
          <p className="text-muted-foreground">{error || "No active workspace found. Accept a proposal to create one."}</p>
        </div>
      </DashboardLayout>
    );
  }

  const job = workspace.job;
  const isWorkspaceClosed = workspace.status === "Completed" || job.status === "completed";
  const hasSubmission = Boolean(workspace.submission?.submittedAt && workspace.submission?.link);
  const canFreelancerSubmit = isFreelancer && (job.status === "assigned" || job.status === "in-progress");
  const deadlineEndMs = new Date(`${job.deadline}T23:59:59`).getTime();
  const remainingToDeadlineMs = deadlineEndMs - nowMs;
  const completedAtMs = workspace.approvedAt ? new Date(workspace.approvedAt).getTime() : null;
  const startedAtMs = new Date(workspace.createdAt).getTime();
  const projectTimerLabel = Number.isNaN(deadlineEndMs)
    ? "Deadline unavailable"
    : remainingToDeadlineMs >= 0
      ? `${formatDuration(remainingToDeadlineMs)} left`
      : `${formatDuration(Math.abs(remainingToDeadlineMs))} overdue`;
  const projectElapsedLabel = Number.isNaN(startedAtMs)
    ? ""
    : job.status === "completed" && completedAtMs
      ? `Completed in ${formatDuration(Math.max(completedAtMs - startedAtMs, 0))}`
      : `Live for ${formatDuration(Math.max(nowMs - startedAtMs, 0))}`;

  return (
    <DashboardLayout title="Workspace">
      {error ? (
        <div className="mb-5 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          {error}
        </div>
      ) : null}

      <section className="mb-6 rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="display-font truncate text-xl font-semibold text-card-foreground">{job.title}</h2>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {job.deadline}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" /> ₹{job.budget}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" /> {projectTimerLabel}
              </span>
              {projectElapsedLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5" /> {projectElapsedLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="flex h-[560px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-sm">
            <div className="border-b border-border/70 px-5 py-4">
              <h3 className="display-font text-lg font-semibold text-card-foreground">Team chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isPosterMessage={msg.senderId === workspace.poster.id}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
              )}
            </div>

            <div className="border-t border-border/70 p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  placeholder={isWorkspaceClosed ? "Workspace closed. Chat disabled." : "Type a message"}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={sending || isWorkspaceClosed}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button size="icon" onClick={sendMessage} disabled={sending || isWorkspaceClosed}>
                  {sending ? <Upload className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-card-foreground">Shared resources</h3>
              {!isWorkspaceClosed ? (
                <button
                  onClick={() => setShowAddLink((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              ) : null}
            </div>

            {showAddLink ? (
              <div className="mb-3 flex gap-2">
                <Input placeholder="https://..." value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                <Button size="sm" onClick={addLink}>Add</Button>
              </div>
            ) : null}

            <div className="space-y-2">
              {workspace.resources.length > 0 ? (
                workspace.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border bg-background/60 p-2.5 text-sm text-accent hover:bg-accent/5"
                  >
                    <Link2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{resource.url}</span>
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No resources shared yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-card-foreground">Submission</h3>
            <div className="space-y-3">
              {isFreelancer ? (
                <>
                  <Input
                    placeholder="Submission link or file URL"
                    value={submissionLink}
                    onChange={(e) => setSubmissionLink(e.target.value)}
                    disabled={!canFreelancerSubmit}
                  />

                  <Textarea
                    placeholder="Notes for reviewer (optional)"
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    rows={3}
                    disabled={!canFreelancerSubmit}
                  />

                  {canFreelancerSubmit ? (
                    <Button className="w-full" onClick={submitWork}>
                      <Upload className="h-4 w-4" /> Submit Work
                    </Button>
                  ) : null}

                  {workspace.submission?.submittedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Submitted at {new Date(workspace.submission.submittedAt).toLocaleString()}
                    </p>
                  ) : null}

                  <p className="text-xs text-muted-foreground">Add your final deliverables and notes for review.</p>
                </>
              ) : null}

              {isPoster ? (
                <>
                  {hasSubmission ? (
                    <div className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">Submitted Link</p>
                      <a
                        href={workspace.submission.link}
                        target="_blank"
                        rel="noreferrer"
                        className="block truncate text-sm font-medium text-accent hover:text-accent/80"
                      >
                        {workspace.submission.link}
                      </a>
                      <p className="text-xs font-semibold uppercase tracking-[0.03em] text-muted-foreground">Notes</p>
                      <p className="text-sm text-muted-foreground">{workspace.submission.notes || "No notes added."}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted at {new Date(workspace.submission.submittedAt || "").toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Freelancer has not submitted work yet.</p>
                  )}

                  {job.status === "submitted" ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={requestChanges}
                        disabled={requestingChanges || approving}
                      >
                        {requestingChanges ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                        Back to Development
                      </Button>
                      <Button className="w-full" onClick={approveSubmission} disabled={approving || requestingChanges}>
                        {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Approve Submission
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {job.status === "completed" ? (
            <div className="rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-card-foreground">Project Rating</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Rate {isPoster ? workspace.freelancer.name : workspace.poster.name} for this completed project.
                </p>
                <RatingStars rating={rating} interactive={!submittingRating} onChange={setRating} size={20} />
                <Textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Optional feedback"
                  rows={3}
                  disabled={submittingRating}
                />
                <Button className="w-full" onClick={submitRating} disabled={submittingRating || rating < 1}>
                  {submittingRating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Rating
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Workspace;
