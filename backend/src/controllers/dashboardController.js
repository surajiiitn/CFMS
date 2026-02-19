import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Job } from "../models/Job.js";
import { Proposal } from "../models/Proposal.js";
import { serializeJob } from "../utils/serializer.js";

const userProjection = "name email avatar branch year skills bio github portfolio activeRole ratingAvg";

const getProposalCountMap = async (jobIds) => {
  const counts = await Proposal.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: "$job", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((row) => [row._id.toString(), row.count]));
};

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (req.user.activeRole === "poster") {
    const [jobsPosted, proposalsCount, active, completed, recentJobs] = await Promise.all([
      Job.countDocuments({ poster: userId }),
      Proposal.countDocuments({ poster: userId }),
      Job.countDocuments({ poster: userId, status: { $in: ["Assigned", "InProgress", "Submitted"] } }),
      Job.countDocuments({ poster: userId, status: "Completed" }),
      Job.find({ poster: userId }).populate("poster", userProjection).sort({ createdAt: -1 }).limit(4),
    ]);

    const jobIds = recentJobs.map((job) => job._id);
    const proposalCountMap = await getProposalCountMap(jobIds);

    return sendSuccess(res, 200, "Dashboard fetched", {
      role: "poster",
      stats: {
        jobsPosted,
        proposalsCount,
        active,
        completed,
      },
      recentJobs: recentJobs.map((job) =>
        serializeJob(job, {
          applicants: [],
          applicantsCount: proposalCountMap.get(job._id.toString()) || 0,
        })
      ),
    });
  }

  const [availableJobs, myProposals, recentJobs] = await Promise.all([
    Job.countDocuments({ status: "Open", poster: { $ne: userId } }),
    Proposal.countDocuments({ freelancer: userId }),
    Job.find({ status: "Open", poster: { $ne: userId } })
      .populate("poster", userProjection)
      .sort({ createdAt: -1 })
      .limit(4),
  ]);

  const activeGigs = await Proposal.countDocuments({
    freelancer: userId,
    status: "Accepted",
  }).then(async (acceptedCount) => {
    if (!acceptedCount) return 0;
    const accepted = await Proposal.find({ freelancer: userId, status: "Accepted" }).select("job");
    const jobIds = accepted.map((item) => item.job);
    return Job.countDocuments({ _id: { $in: jobIds }, status: { $in: ["Assigned", "InProgress", "Submitted"] } });
  });

  const acceptedCompleted = await Proposal.find({ freelancer: userId, status: "Accepted" }).select("job quote");
  const completedJobIds = acceptedCompleted.map((item) => item.job);
  const completedJobs = await Job.find({ _id: { $in: completedJobIds }, status: "Completed" }).select("_id");
  const completedSet = new Set(completedJobs.map((job) => job._id.toString()));
  const earned = acceptedCompleted
    .filter((item) => completedSet.has(item.job.toString()))
    .reduce((sum, item) => sum + item.quote, 0);

  const jobIds = recentJobs.map((job) => job._id);
  const proposalCountMap = await getProposalCountMap(jobIds);

  return sendSuccess(res, 200, "Dashboard fetched", {
    role: "freelancer",
    stats: {
      availableJobs,
      myProposals,
      activeGigs,
      earned,
    },
    recentJobs: recentJobs.map((job) =>
      serializeJob(job, {
        applicants: [],
        applicantsCount: proposalCountMap.get(job._id.toString()) || 0,
      })
    ),
  });
});
