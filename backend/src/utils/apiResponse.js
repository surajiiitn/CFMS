export const sendResponse = (res, statusCode, success, message, data = null) => {
  res.status(statusCode).json({
    success,
    message,
    data,
  });
};

export const sendSuccess = (res, statusCode, message, data = null) =>
  sendResponse(res, statusCode, true, message, data);

export const sendError = (res, statusCode, message, data = null) =>
  sendResponse(res, statusCode, false, message, data);
