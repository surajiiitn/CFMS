import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Review } from "../models/Review.js";
import { Workspace } from "../models/Workspace.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { serializeReview, serializeUser } from "../utils/serializer.js";

const userProjection = "name email avatar branch year skills bio github portfolio activeRole ratingAvg";

export const createWorkspaceReview = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { toUserId, rating, comment } = req.body;

  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  const workspace = await Workspace.findById(workspaceId).populate("job");
  if (!workspace) throw new ApiError(404, "Workspace not found");

  const userId = req.user._id.toString();
  const posterId = workspace.poster.toString();
  const freelancerId = workspace.freelancer.toString();

  if (![posterId, freelancerId].includes(userId)) {
    throw new ApiError(403, "Forbidden");
  }

  if (workspace.job.status !== "Completed") {
    throw new ApiError(400, "Reviews are allowed only after completion");
  }

  let targetUserId = toUserId ? String(toUserId) : posterId === userId ? freelancerId : posterId;

  if (![posterId, freelancerId].includes(targetUserId) || targetUserId === userId) {
    throw new ApiError(400, "Invalid review target");
  }

  const existing = await Review.findOne({ workspace: workspace._id });

  if (existing) {
    throw new ApiError(409, "Rating already submitted for this workspace");
  }

  const review = await Review.create({
    workspace: workspace._id,
    fromUser: req.user._id,
    toUser: targetUserId,
    rating: parsedRating,
    comment: String(comment || "").trim(),
  });

  const target = await User.findById(targetUserId);
  if (!target) throw new ApiError(404, "Target user not found");

  const newCount = target.ratingCount + 1;
  target.ratingAvg = (target.ratingAvg * target.ratingCount + parsedRating) / newCount;
  target.ratingCount = newCount;
  await target.save();

  await review.populate("fromUser", userProjection);
  await review.populate("toUser", userProjection);

  const [workspaceDeleteResult] = await Promise.all([
    Workspace.deleteOne({ _id: workspace._id }),
    Message.deleteMany({ workspace: workspace._id }),
  ]);

  return sendSuccess(res, 201, "Review submitted", {
    review: serializeReview(review, {
      fromUser: serializeUser(review.fromUser),
      toUser: serializeUser(review.toUser),
    }),
    workspaceRemoved: workspaceDeleteResult.deletedCount > 0,
  });
});
