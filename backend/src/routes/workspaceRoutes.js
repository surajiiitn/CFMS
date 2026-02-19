import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addWorkspaceResource,
  approveWorkspaceSubmission,
  getWorkspaceById,
  listMyWorkspaces,
  listWorkspaceMessages,
  sendWorkspaceMessage,
  startWorkspace,
  submitWorkspaceWork,
} from "../controllers/workspaceController.js";
import { createWorkspaceReview } from "../controllers/reviewController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMyWorkspaces);
router.get("/:workspaceId", getWorkspaceById);
router.get("/:workspaceId/messages", listWorkspaceMessages);
router.post("/:workspaceId/messages", sendWorkspaceMessage);
router.post("/:workspaceId/resources", addWorkspaceResource);
router.post("/:workspaceId/start", startWorkspace);
router.post("/:workspaceId/submit", submitWorkspaceWork);
router.post("/:workspaceId/approve", approveWorkspaceSubmission);
router.post("/:workspaceId/reviews", createWorkspaceReview);

export default router;
