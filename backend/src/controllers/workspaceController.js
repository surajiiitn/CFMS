import validator from "validator";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Job } from "../models/Job.js";
import { Workspace } from "../models/Workspace.js";
import { Message } from "../models/Message.js";
import { Proposal } from "../models/Proposal.js";
import { createNotification } from "../utils/notifications.js";
import { serializeJob, serializeMessage, serializeWorkspace } from "../utils/serializer.js";
import { ensureParticipant, getCounterpartyId, setJobStatus } from "../utils/workflow.js";
import { getSocketServer } from "../config/socket.js";

const userProjection = "name email avatar branch year skills bio github portfolio activeRole ratingAvg";

const loadWorkspace = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate("poster", userProjection)
    .populate("freelancer", userProjection)
    .populate({
      path: "job",
      populate: { path: "poster", select: userProjection },
    });

  if (!workspace) throw new ApiError(404, "Workspace not found");

  return workspace;
};

const maybeMoveToInProgress = async (job) => {
  if (job.status === "Assigned") {
    await setJobStatus(job, "InProgress");
  }
};

const emitWorkspaceEvent = (workspaceId, event, payload) => {
  const io = getSocketServer();
  if (!io) return;
  io.to(`workspace:${workspaceId}`).emit(event, payload);
};

export const listMyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [{ poster: req.user._id }, { freelancer: req.user._id }],
    status: "Active",
  })
    .populate("poster", userProjection)
    .populate("freelancer", userProjection)
    .populate({
      path: "job",
      populate: { path: "poster", select: userProjection },
    })
    .sort({ updatedAt: -1 });

  const activeWorkspaces = workspaces.filter(
    (workspace) => workspace.status === "Active" && workspace.job && workspace.job.status !== "Completed"
  );

  const jobIds = activeWorkspaces.map((w) => w.job?._id).filter(Boolean);
  const proposalCounts = await Proposal.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(proposalCounts.map((item) => [item._id.toString(), item.count]));

  const items = activeWorkspaces.map((workspace) => {
    const applicantsCount = workspace.job ? countMap.get(workspace.job._id.toString()) || 0 : 0;
    const serializedJob = workspace.job
      ? serializeJob(workspace.job, { applicants: [], applicantsCount })
      : null;

    return serializeWorkspace(workspace, { job: serializedJob });
  });

  return sendSuccess(res, 200, "Workspaces fetched", {
    workspaces: items,
  });
});

export const getWorkspaceById = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await loadWorkspace(workspaceId);
  ensureParticipant(workspace, req.user._id);

  const applicantsCount = await Proposal.countDocuments({ job: workspace.job._id });
  const serializedJob = serializeJob(workspace.job, { applicants: [], applicantsCount });

  const messages = await Message.find({ workspace: workspace._id }).sort({ createdAt: 1 }).limit(200);

  return sendSuccess(res, 200, "Workspace fetched", {
    workspace: serializeWorkspace(workspace, { job: serializedJob }),
    messages: messages.map((msg) => serializeMessage(msg)),
  });
});

export const listWorkspaceMessages = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  const messages = await Message.find({ workspace: workspace._id }).sort({ createdAt: 1 }).limit(limit);

  return sendSuccess(res, 200, "Messages fetched", {
    messages: messages.map((msg) => serializeMessage(msg)),
  });
});

export const sendWorkspaceMessage = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { text } = req.body;

  if (!text || !String(text).trim()) {
    throw new ApiError(400, "Message text is required");
  }

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  await maybeMoveToInProgress(workspace.job);

  const message = await Message.create({
    workspace: workspace._id,
    sender: req.user._id,
    text: String(text).trim(),
  });

  const serialized = serializeMessage(message);

  emitWorkspaceEvent(workspace._id.toString(), "workspace:message:new", serialized);

  const recipient = getCounterpartyId(workspace, req.user._id);
  await createNotification({
    recipient,
    actor: req.user._id,
    type: "message",
    title: "New Message",
    description: `${req.user.name} sent you a message`,
    metadata: { workspace: workspace._id, job: workspace.job._id },
  });

  return sendSuccess(res, 201, "Message sent", {
    message: serialized,
  });
});

export const addWorkspaceResource = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { url } = req.body;

  if (!url || !validator.isURL(String(url), { require_protocol: true })) {
    throw new ApiError(400, "A valid URL is required");
  }

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  await maybeMoveToInProgress(workspace.job);

  workspace.resources.push({
    url: String(url).trim(),
    addedBy: req.user._id,
  });

  await workspace.save();

  emitWorkspaceEvent(workspace._id.toString(), "workspace:resource:new", {
    url: String(url).trim(),
    addedBy: req.user._id.toString(),
  });

  return sendSuccess(res, 200, "Resource added", {
    resources: workspace.resources,
  });
});

export const startWorkspace = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  if (workspace.job.status === "Assigned") {
    await setJobStatus(workspace.job, "InProgress");
  }

  return sendSuccess(res, 200, "Workspace active", {
    jobStatus: workspace.job.status,
  });
});

export const submitWorkspaceWork = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { link, notes } = req.body;

  if (!link || !validator.isURL(String(link), { require_protocol: true })) {
    throw new ApiError(400, "A valid submission link is required");
  }

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  if (workspace.freelancer.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the selected freelancer can submit work");
  }

  if (!["Assigned", "InProgress"].includes(workspace.job.status)) {
    throw new ApiError(400, "Work can only be submitted when the job is assigned or in progress");
  }

  if (workspace.job.status === "Assigned") {
    await setJobStatus(workspace.job, "InProgress");
  }

  workspace.submission = {
    link: String(link).trim(),
    notes: String(notes || "").trim(),
    submittedAt: new Date(),
  };
  await workspace.save();

  await setJobStatus(workspace.job, "Submitted");

  emitWorkspaceEvent(workspace._id.toString(), "workspace:submitted", {
    workspaceId: workspace._id.toString(),
    submission: workspace.submission,
  });

  await createNotification({
    recipient: workspace.poster,
    actor: req.user._id,
    type: "submitted",
    title: "Work Submitted",
    description: `${req.user.name} submitted work for review`,
    metadata: { workspace: workspace._id, job: workspace.job._id },
  });

  return sendSuccess(res, 200, "Work submitted", {
    submission: workspace.submission,
    jobStatus: workspace.job.status,
  });
});

export const approveWorkspaceSubmission = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  ensureParticipant(workspace, req.user._id);

  if (workspace.poster.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the poster can approve submissions");
  }

  if (!workspace.submission?.submittedAt) {
    throw new ApiError(400, "No submission found");
  }

  if (workspace.job.status !== "Submitted") {
    throw new ApiError(400, "Job is not in submitted state");
  }

  await setJobStatus(workspace.job, "Completed");

  workspace.status = "Completed";
  workspace.approvedAt = new Date();
  await workspace.save();

  emitWorkspaceEvent(workspace._id.toString(), "workspace:completed", {
    workspaceId: workspace._id.toString(),
    approvedAt: workspace.approvedAt,
  });

  await createNotification({
    recipient: workspace.freelancer,
    actor: req.user._id,
    type: "completed",
    title: "Job Completed",
    description: "Your submission has been approved",
    metadata: { workspace: workspace._id, job: workspace.job._id },
  });

  return sendSuccess(res, 200, "Submission approved", {
    approvedAt: workspace.approvedAt,
    jobStatus: workspace.job.status,
    workspaceRemoved: true,
  });
});
