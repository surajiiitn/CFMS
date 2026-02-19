import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMyNotifications);
router.patch("/:notificationId/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;
