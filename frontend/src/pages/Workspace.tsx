import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ChatMessage } from "@/components/ChatMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { connectSocket, getSocket, joinWorkspaceRoom, leaveWorkspaceRoom, sendWorkspaceSocketMessage } from "@/lib/socket";
import type { ChatMsg, Workspace as WorkspaceType } from "@/types/cfms";
import { useToast } from "@/hooks/use-toast";
import { Send, Link2, Upload, Plus, Calendar, DollarSign, CheckCircle2, FolderOpen } from "lucide-react";

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
  const [error, setError] = useState("");

  const refreshWorkspace = useCallback(async (workspaceId: string) => {
    const data = await api.workspaces.getById(workspaceId);
    setWorkspace(data.workspace);
    setMessages(data.messages);
    setSubmissionLink(data.workspace.submission?.link || "");
    setSubmissionNotes(data.workspace.submission?.notes || "");
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError("");

      try {
        const list = await api.workspaces.listMine();

        if (list.workspaces.length === 0) {
          setWorkspace(null);
          setMessages([]);
          setLoading(false);
          return;
        }

        const targetWorkspaceId = id || list.workspaces[0].id;

        if (!id) {
          navigate(`/workspace/${targetWorkspaceId}`, { replace: true });
          return;
        }

        await refreshWorkspace(targetWorkspaceId);

        try {
          await api.workspaces.start(targetWorkspaceId);
        } catch {
          // ignore if already started/completed
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load workspace");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [id, navigate, refreshWorkspace]);

  useEffect(() => {
    if (!id || !token) return;

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

    const onCompleted = () => {
      refreshWorkspace(id).catch(() => null);
    };

    socket.on("connect", onSocketConnect);
    socket.on("workspace:message:new", onNewMessage);
    socket.on("workspace:submitted", onSubmitted);
    socket.on("workspace:completed", onCompleted);

    return () => {
      const activeSocket = getSocket();
      activeSocket?.off("connect", onSocketConnect);
      activeSocket?.off("workspace:message:new", onNewMessage);
      activeSocket?.off("workspace:submitted", onSubmitted);
      activeSocket?.off("workspace:completed", onCompleted);
      leaveWorkspaceRoom(id);
    };
  }, [id, token, refreshWorkspace]);

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
                <DollarSign className="h-3.5 w-3.5" /> ₹{job.budget}
              </span>
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
                messages.map((msg) => <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />)
              ) : (
                <p className="text-sm text-muted-foreground">No messages yet. Start the conversation.</p>
              )}
            </div>

            <div className="border-t border-border/70 p-3 sm:p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button size="icon" onClick={sendMessage} disabled={sending}>
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
              <button
                onClick={() => setShowAddLink((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
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
              <Input
                placeholder="Submission link or file URL"
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                disabled={Boolean(workspace.submission?.submittedAt && !isFreelancer)}
              />

              <Textarea
                placeholder="Notes for reviewer (optional)"
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                rows={3}
                disabled={Boolean(workspace.submission?.submittedAt && !isFreelancer)}
              />

              {isFreelancer && job.status !== "completed" ? (
                <Button className="w-full" onClick={submitWork}>
                  <Upload className="h-4 w-4" /> Submit Work
                </Button>
              ) : null}

              {isPoster && job.status === "submitted" ? (
                <Button className="w-full" onClick={approveSubmission}>
                  <CheckCircle2 className="h-4 w-4" /> Approve Submission
                </Button>
              ) : null}

              {workspace.submission?.submittedAt ? (
                <p className="text-xs text-muted-foreground">
                  Submitted at {new Date(workspace.submission.submittedAt).toLocaleString()}
                </p>
              ) : null}

              <p className="text-xs text-muted-foreground">Add your final deliverables and notes for review.</p>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default Workspace;
