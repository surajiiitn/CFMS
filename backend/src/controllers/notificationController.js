import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { Notification } from "../models/Notification.js";
import { serializeNotification } from "../utils/serializer.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

  return sendSuccess(res, 200, "Notifications fetched", {
    notifications: notifications.map((item) => serializeNotification(item)),
    unreadCount,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  await Notification.updateOne(
    { _id: notificationId, recipient: req.user._id },
    { $set: { read: true } }
  );

  return sendSuccess(res, 200, "Notification updated", null);
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id }, { $set: { read: true } });

  return sendSuccess(res, 200, "All notifications marked as read", null);
});
