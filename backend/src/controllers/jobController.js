import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Job } from "../models/Job.js";
import { Proposal } from "../models/Proposal.js";
import { Workspace } from "../models/Workspace.js";
import { clientJobToDbStatus } from "../utils/status.js";
import { getPagination } from "../utils/pagination.js";
import { getJobDescriptionWordCountError, sanitizeSkillList } from "../utils/validation.js";
import { serializeJob, serializeProposal } from "../utils/serializer.js";

const userProjection = "name email avatar branch year skills bio github portfolio activeRole ratingAvg";

const getApplicantsCountMap = async (jobIds) => {
  if (jobIds.length === 0) return new Map();

  const counts = await Proposal.aggregate([
    { $match: { job: { $in: jobIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((item) => [item._id.toString(), item.count]));
};

export const listJobs = asyncHandler(async (req, res) => {
  const { search, status, skills, mine, assignedToMe } = req.query;
  const { page, limit, skip } = getPagination(req.query);

  const filter = {};

  if (search && String(search).trim()) {
    filter.$text = { $search: String(search).trim() };
  }

  if (status && status !== "All") {
    const mappedStatus = clientJobToDbStatus[String(status)] || String(status);
    if (!["Open", "Assigned", "InProgress", "Submitted", "Completed"].includes(mappedStatus)) {
      throw new ApiError(400, "Invalid status filter");
    }
    filter.status = mappedStatus;
  }

  if (skills) {
    const skillList = Array.isArray(skills)
      ? sanitizeSkillList(skills)
      : sanitizeSkillList(String(skills).split(","));
    if (skillList.length > 0) {
      filter.skills = { $in: skillList };
    }
  }

  if (mine === "true") {
    filter.poster = req.user._id;
  }

  if (assignedToMe === "true") {
    filter.selectedFreelancer = req.user._id;
  }

  const sort = search
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : { createdAt: -1 };

  const query = Job.find(filter).populate("poster", userProjection).sort(sort).skip(skip).limit(limit);
  if (search) query.select({ score: { $meta: "textScore" } });

  const [jobs, total] = await Promise.all([query, Job.countDocuments(filter)]);

  const jobIds = jobs.map((job) => job._id.toString());
  const applicantsCountMap = await getApplicantsCountMap(jobIds);

  const items = jobs.map((job) =>
    serializeJob(job, {
      applicants: [],
      applicantsCount: applicantsCountMap.get(job._id.toString()) || 0,
    })
  );

  return sendSuccess(res, 200, "Jobs fetched", {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

export const getJobById = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId).populate("poster", userProjection);
  if (!job) throw new ApiError(404, "Job not found");

  const applicantsCount = await Proposal.countDocuments({ job: job._id });

  let applicants = [];
  const isPoster = job.poster._id.toString() === req.user._id.toString();

  if (isPoster) {
    const proposals = await Proposal.find({ job: job._id })
      .populate("freelancer", userProjection)
      .sort({ createdAt: -1 });

    applicants = proposals.map((proposal) => serializeProposal(proposal));
  }

  const serialized = serializeJob(job, {
    applicants,
    applicantsCount,
  });

  return sendSuccess(res, 200, "Job fetched", { job: serialized });
});

export const createJob = asyncHandler(async (req, res) => {
  const { title, description, skills, budget, deadline, deliverables, referenceLinks } = req.body;

  if (!title || !description || !budget || !deadline) {
    throw new ApiError(400, "title, description, budget and deadline are required");
  }

  const parsedBudget = Number(budget);
  if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
    throw new ApiError(400, "Budget must be a positive number");
  }

  const normalizedDescription = String(description).trim();
  const descriptionWordError = getJobDescriptionWordCountError(normalizedDescription);
  if (descriptionWordError) {
    throw new ApiError(400, descriptionWordError);
  }

  const parsedDeadline = new Date(deadline);
  if (Number.isNaN(parsedDeadline.getTime())) {
    throw new ApiError(400, "Deadline is invalid");
  }

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  if (parsedDeadline < tomorrow) {
    throw new ApiError(400, "Deadline must be today or a future date");
  }

  const job = await Job.create({
    title: String(title).trim(),
    description: normalizedDescription,
    skills: sanitizeSkillList(skills),
    budget: parsedBudget,
    deadline: parsedDeadline,
    deliverables: String(deliverables || "").trim(),
    referenceLinks: Array.isArray(referenceLinks)
      ? referenceLinks.map((item) => String(item).trim()).filter(Boolean)
      : [],
    poster: req.user._id,
  });

  await job.populate("poster", userProjection);

  return sendSuccess(res, 201, "Job created", {
    job: serializeJob(job, { applicants: [], applicantsCount: 0 }),
  });
});

export const updateJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { title, description, skills, budget, deadline, deliverables, referenceLinks } = req.body;

  const job = await Job.findById(jobId).populate("poster", userProjection);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.poster._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden");
  }

  if (job.status !== "Open") {
    throw new ApiError(400, "Only open jobs can be edited");
  }

  if (title !== undefined) job.title = String(title).trim();
  if (description !== undefined) {
    const normalizedDescription = String(description).trim();
    const descriptionWordError = getJobDescriptionWordCountError(normalizedDescription);
    if (descriptionWordError) {
      throw new ApiError(400, descriptionWordError);
    }
    job.description = normalizedDescription;
  }
  if (skills !== undefined) job.skills = sanitizeSkillList(skills);
  if (budget !== undefined) {
    const parsedBudget = Number(budget);
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      throw new ApiError(400, "Budget must be a positive number");
    }
    job.budget = parsedBudget;
  }

  if (deadline !== undefined) {
    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) throw new ApiError(400, "Deadline is invalid");
    job.deadline = parsedDeadline;
  }

  if (deliverables !== undefined) job.deliverables = String(deliverables || "").trim();

  if (referenceLinks !== undefined) {
    job.referenceLinks = Array.isArray(referenceLinks)
      ? referenceLinks.map((item) => String(item).trim()).filter(Boolean)
      : [];
  }

  await job.save();

  const applicantsCount = await Proposal.countDocuments({ job: job._id });

  return sendSuccess(res, 200, "Job updated", {
    job: serializeJob(job, { applicants: [], applicantsCount }),
  });
});

export const deleteJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  if (job.poster.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Forbidden");
  }

  if (job.status !== "Open") {
    throw new ApiError(400, "Only open jobs can be deleted");
  }

  await Promise.all([
    Proposal.deleteMany({ job: job._id }),
    Workspace.deleteOne({ job: job._id }),
    Job.deleteOne({ _id: job._id }),
  ]);

  return sendSuccess(res, 200, "Job deleted", null);
});
