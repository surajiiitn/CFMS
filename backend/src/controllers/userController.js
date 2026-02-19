import { asyncHandler } from "../middleware/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { isValidUrlOrEmpty, sanitizeSkillList } from "../utils/validation.js";
import { serializeReview, serializeUser } from "../utils/serializer.js";
import { Review } from "../models/Review.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, "Profile fetched", {
    user: serializeUser(req.user),
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, branch, year, bio, github, portfolio, skills } = req.body;

  if (name !== undefined) {
    if (String(name).trim().length < 2) throw new ApiError(400, "Name is too short");
    req.user.name = String(name).trim();
  }

  if (branch !== undefined) req.user.branch = String(branch).trim();

  if (year !== undefined) {
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 8) {
      throw new ApiError(400, "Year must be an integer between 1 and 8");
    }
    req.user.year = parsedYear;
  }

  if (bio !== undefined) req.user.bio = String(bio).trim().slice(0, 1000);

  if (github !== undefined) {
    if (!isValidUrlOrEmpty(github)) throw new ApiError(400, "GitHub URL is invalid");
    req.user.github = String(github || "").trim();
  }

  if (portfolio !== undefined) {
    if (!isValidUrlOrEmpty(portfolio)) throw new ApiError(400, "Portfolio URL is invalid");
    req.user.portfolio = String(portfolio || "").trim();
  }

  if (skills !== undefined) {
    req.user.skills = sanitizeSkillList(skills);
  }

  await req.user.save();

  return sendSuccess(res, 200, "Profile updated", {
    user: serializeUser(req.user),
  });
});

export const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const reviews = await Review.find({ toUser: userId })
    .populate("fromUser", "name email avatar branch year skills bio github portfolio activeRole ratingAvg")
    .populate("toUser", "name email avatar branch year skills bio github portfolio activeRole ratingAvg")
    .sort({ createdAt: -1 })
    .limit(100);

  return sendSuccess(res, 200, "Reviews fetched", {
    reviews: reviews.map((review) => serializeReview(review)),
  });
});
