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
import { Send, Link2, Upload, Plus, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

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

    let mounted = true;

    joinWorkspaceRoom(id).catch(() => {
      if (!mounted) return;
      setError("Unable to join workspace room");
    });

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

    socket.on("workspace:message:new", onNewMessage);
    socket.on("workspace:submitted", onSubmitted);
    socket.on("workspace:completed", onCompleted);

    return () => {
      mounted = false;
      const activeSocket = getSocket();
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
      toast({ title: "Work Submitted", description: "Your work has been submitted for review." });
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
      toast({ title: "Submission Approved", description: "Job marked as completed." });
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
        <p className="text-sm text-muted-foreground">Loading workspace...</p>
      </DashboardLayout>
    );
  }

  if (!workspace) {
    return (
      <DashboardLayout title="Workspace">
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {error || "No active workspace found. Accept a proposal to create one."}
        </div>
      </DashboardLayout>
    );
  }

  const job = workspace.job;

  return (
    <DashboardLayout title="Workspace">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-card-foreground truncate">{job.title}</h2>
              <StatusBadge status={job.status} />
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{job.deadline}</span>
              <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />₹{job.budget}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card flex flex-col h-[500px]">
            <div className="border-b border-border px-4 py-3">
              <h3 className="font-semibold text-sm text-card-foreground">Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} isOwn={msg.senderId === user?.id} />
              ))}
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
              />
              <Button size="icon" onClick={sendMessage} disabled={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-card-foreground">Shared Resources</h3>
                <button onClick={() => setShowAddLink(!showAddLink)} className="text-accent hover:underline text-xs font-medium">
                  <Plus className="inline h-3 w-3 mr-0.5" />Add
                </button>
              </div>
              {showAddLink && (
                <div className="flex gap-2 mb-3">
                  <Input placeholder="https://..." value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                  <Button size="sm" onClick={addLink}>Add</Button>
                </div>
              )}
              <div className="space-y-2">
                {workspace.resources.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resources shared yet.</p>
                ) : (
                  workspace.resources.map((resource) => (
                    <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-secondary p-2.5 text-sm text-accent hover:underline truncate">
                      <Link2 className="h-4 w-4 shrink-0" />{resource.url}
                    </a>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-sm text-card-foreground mb-3">Submission</h3>
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

                {isFreelancer && job.status !== "completed" && (
                  <Button className="flex-1 w-full" onClick={submitWork}>
                    <Upload className="mr-2 h-4 w-4" />Submit Work
                  </Button>
                )}

                {isPoster && job.status === "submitted" && (
                  <Button className="flex-1 w-full" onClick={approveSubmission}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />Approve Submission
                  </Button>
                )}

                {workspace.submission?.submittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Submitted at {new Date(workspace.submission.submittedAt).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Upload your deliverables for review and completion.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Workspace;
