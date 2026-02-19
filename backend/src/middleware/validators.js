import { ApiError } from "../utils/apiError.js";

export const requireFields = (fields) => (req, _res, next) => {
  const missing = fields.filter((field) => {
    const value = req.body[field];
    return value === undefined || value === null || value === "";
  });

  if (missing.length > 0) {
    return next(new ApiError(400, `Missing required fields: ${missing.join(", ")}`));
  }

  return next();
};
