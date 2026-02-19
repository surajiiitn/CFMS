import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { sendError } from "../utils/apiResponse.js";

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return sendError(res, 401, "Unauthorized");
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId);
    if (!user) {
      return sendError(res, 401, "Unauthorized");
    }

    req.user = user;
    req.auth = payload;
    return next();
  } catch {
    return sendError(res, 401, "Unauthorized");
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 401, "Unauthorized");
  if (!roles.includes(req.user.activeRole)) {
    return sendError(res, 403, "Forbidden");
  }
  return next();
};
