import { dbJobToClientStatus, dbProposalToClientStatus } from "./status.js";

const dateOnly = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const relativeTime = (value) => {
  const date = new Date(value);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  return rtf.format(Math.round(diff / day), "day");
};

export const serializeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id || user._id?.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    branch: user.branch,
    year: user.year,
    skills: user.skills || [],
    bio: user.bio || "",
    github: user.github || "",
    portfolio: user.portfolio || "",
    rating: Number(user.ratingAvg || 0).toFixed(1) * 1,
    role: user.activeRole,
  };
};

export const serializeProposal = (proposal) => ({
  id: proposal.id || proposal._id?.toString(),
  freelancer: serializeUser(proposal.freelancer),
  approach: proposal.approach,
  timeline: proposal.timeline,
  quote: proposal.quote,
  status: dbProposalToClientStatus[proposal.status] || "pending",
  createdAt: proposal.createdAt,
});

export const serializeJob = (job, options = {}) => {
  const applicants = options.applicants || [];

  return {
    id: job.id || job._id?.toString(),
    title: job.title,
    description: job.description,
    skills: job.skills || [],
    budget: job.budget,
    deadline: dateOnly(job.deadline),
    deliverables: job.deliverables || "",
    status: dbJobToClientStatus[job.status] || "open",
    poster: serializeUser(job.poster),
    applicants,
    applicantsCount: options.applicantsCount ?? applicants.length,
    createdAt: dateOnly(job.createdAt),
    referenceLinks: job.referenceLinks || [],
  };
};

export const serializeMessage = (message) => ({
  id: message.id || message._id?.toString(),
  senderId: message.sender?.id || message.sender?._id?.toString() || message.sender?.toString(),
  text: message.text,
  timestamp: message.createdAt,
});

export const serializeWorkspace = (workspace, options = {}) => ({
  id: workspace.id || workspace._id?.toString(),
  job: options.job || null,
  poster: serializeUser(workspace.poster),
  freelancer: serializeUser(workspace.freelancer),
  status: workspace.status,
  resources: (workspace.resources || []).map((item, index) => ({
    id: `${workspace.id || workspace._id?.toString()}-res-${index}`,
    url: item.url,
    addedBy: item.addedBy?.toString?.() || item.addedBy,
    createdAt: item.createdAt,
  })),
  submission: workspace.submission || { link: "", notes: "", submittedAt: null },
  approvedAt: workspace.approvedAt,
  createdAt: workspace.createdAt,
  updatedAt: workspace.updatedAt,
});

export const serializeReview = (review, options = {}) => ({
  id: review.id || review._id?.toString(),
  workspaceId: review.workspace?.toString?.() || review.workspace,
  fromUser: options.fromUser || serializeUser(review.fromUser),
  toUser: options.toUser || serializeUser(review.toUser),
  rating: review.rating,
  comment: review.comment,
  createdAt: review.createdAt,
});

export const serializeNotification = (notification) => ({
  id: notification.id || notification._id?.toString(),
  type: notification.type,
  title: notification.title,
  description: notification.description,
  time: relativeTime(notification.createdAt),
  read: notification.read,
  createdAt: notification.createdAt,
});
