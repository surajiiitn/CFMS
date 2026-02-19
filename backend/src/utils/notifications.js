import { Notification } from "../models/Notification.js";

export const createNotification = async ({ recipient, actor = null, type, title, description, metadata = {} }) => {
  if (!recipient) return null;
  return Notification.create({ recipient, actor, type, title, description, metadata });
};
