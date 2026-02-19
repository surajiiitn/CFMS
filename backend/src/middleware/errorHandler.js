import { ApiError } from "../utils/apiError.js";
import { sendError } from "../utils/apiResponse.js";

export const notFound = (req, res) => {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, err.details || null);
  }

  if (err?.name === "ValidationError") {
    return sendError(res, 400, "Validation failed", Object.values(err.errors).map((e) => e.message));
  }

  if (err?.code === 11000) {
    return sendError(res, 409, "Duplicate record");
  }

  console.error(err);
  return sendError(res, 500, "Internal server error");
};
