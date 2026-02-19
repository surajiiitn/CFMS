import { ApiError } from "./apiError.js";
import { canTransitionStatus } from "./status.js";

const normalizeId = (value) => {
  if (!value) return "";
  if (value._id) return value._id.toString();
  return value.toString();
};

export const setJobStatus = async (job, nextStatus) => {
  if (!canTransitionStatus(job.status, nextStatus)) {
    throw new ApiError(400, `Invalid status transition from ${job.status} to ${nextStatus}`);
  }

  job.status = nextStatus;
  const now = new Date();

  if (nextStatus === "Assigned") job.assignedAt = now;
  if (nextStatus === "InProgress") job.inProgressAt = now;
  if (nextStatus === "Submitted") job.submittedAt = now;
  if (nextStatus === "Completed") job.completedAt = now;

  await job.save();
  return job;
};

export const ensureParticipant = (workspace, userId) => {
  const uid = normalizeId(userId);
  const posterId = normalizeId(workspace.poster);
  const freelancerId = normalizeId(workspace.freelancer);

  if (![posterId, freelancerId].includes(uid)) {
    throw new ApiError(403, "Forbidden");
  }
};

export const getCounterpartyId = (workspace, userId) => {
  const uid = normalizeId(userId);
  const posterId = normalizeId(workspace.poster);

  return posterId === uid ? workspace.freelancer : workspace.poster;
};
