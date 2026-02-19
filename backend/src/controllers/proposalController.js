import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Job } from "../models/Job.js";
import { Proposal } from "../models/Proposal.js";
import { Workspace } from "../models/Workspace.js";
import { createNotification } from "../utils/notifications.js";
import { serializeProposal } from "../utils/serializer.js";
import { setJobStatus } from "../utils/workflow.js";

const userProjection = "name email avatar branch year skills bio github portfolio activeRole ratingAvg";

export const createProposal = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { approach, timeline, quote } = req.body;

  if (!approach || !timeline || !quote) {
    throw new ApiError(400, "approach, timeline and quote are required");
  }

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.status !== "Open") {
    throw new ApiError(400, "Applications are closed for this job");
  }

  if (job.poster.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot apply to your own job");
  }

  const existing = await Proposal.findOne({ job: job._id, freelancer: req.user._id });
  if (existing) {
    throw new ApiError(409, "You already applied to this job");
  }

  const proposal = await Proposal.create({
    job: job._id,
    freelancer: req.user._id,
    poster: job.poster,
    approach: String(approach).trim(),
    timeline: String(timeline).trim(),
    quote: Number(quote),
  });

  await proposal.populate("freelancer", userProjection);

  await createNotification({
    recipient: job.poster,
    actor: req.user._id,
    type: "proposal",
    title: "New Proposal Received",
    description: `${req.user.name} applied for '${job.title}'`,
    metadata: { job: job._id },
  });

  return sendSuccess(res, 201, "Proposal submitted", {
    proposal: serializeProposal(proposal),
  });
});

export const listJobProposals = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.poster.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Only the job owner can view all proposals");
  }

  const proposals = await Proposal.find({ job: job._id })
    .populate("freelancer", userProjection)
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "Proposals fetched", {
    proposals: proposals.map((proposal) => serializeProposal(proposal)),
  });
});

export const updateProposalStatus = asyncHandler(async (req, res) => {
  const { jobId, proposalId } = req.params;
  const rawAction = req.body.action || req.body.status;
  const action = String(rawAction || "").toLowerCase();

  if (!["accept", "accepted", "reject", "rejected"].includes(action)) {
    throw new ApiError(400, "action must be accept or reject");
  }

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.poster.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden");
  }

  const proposal = await Proposal.findOne({ _id: proposalId, job: job._id }).populate(
    "freelancer",
    userProjection
  );
  if (!proposal) throw new ApiError(404, "Proposal not found");

  if (proposal.status !== "Pending") {
    throw new ApiError(400, "Proposal already processed");
  }

  if (action === "accept" || action === "accepted") {
    if (job.status !== "Open") {
      throw new ApiError(400, "Job is no longer open for selection");
    }

    proposal.status = "Accepted";
    await proposal.save();

    await Proposal.updateMany(
      { job: job._id, _id: { $ne: proposal._id }, status: "Pending" },
      { $set: { status: "Rejected" } }
    );

    job.selectedFreelancer = proposal.freelancer._id;
    await setJobStatus(job, "Assigned");

    const workspace = await Workspace.findOneAndUpdate(
      { job: job._id },
      {
        $setOnInsert: {
          job: job._id,
          poster: job.poster,
          freelancer: proposal.freelancer._id,
          status: "Active",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await createNotification({
      recipient: proposal.freelancer._id,
      actor: req.user._id,
      type: "accepted",
      title: "Proposal Accepted",
      description: `You were selected for '${job.title}'`,
      metadata: { job: job._id, workspace: workspace._id },
    });

    return sendSuccess(res, 200, "Proposal accepted", {
      proposal: serializeProposal(proposal),
      workspaceId: workspace.id,
    });
  }

  proposal.status = "Rejected";
  await proposal.save();

  await createNotification({
    recipient: proposal.freelancer._id,
    actor: req.user._id,
    type: "rejected",
    title: "Proposal Rejected",
    description: `Your proposal for '${job.title}' was not selected`,
    metadata: { job: job._id },
  });

  return sendSuccess(res, 200, "Proposal rejected", {
    proposal: serializeProposal(proposal),
  });
});

export const listMyProposals = asyncHandler(async (req, res) => {
  const proposals = await Proposal.find({ freelancer: req.user._id })
    .populate("freelancer", userProjection)
    .populate({
      path: "job",
      populate: { path: "poster", select: userProjection },
    })
    .sort({ createdAt: -1 });

  return sendSuccess(res, 200, "My proposals fetched", {
    proposals: proposals.map((proposal) => ({
      ...serializeProposal(proposal),
      jobId: proposal.job?._id?.toString(),
      jobTitle: proposal.job?.title || "",
      jobStatus: proposal.job?.status || "",
    })),
  });
});
