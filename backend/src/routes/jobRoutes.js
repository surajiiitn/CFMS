import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  createJob,
  deleteJob,
  getJobById,
  listJobs,
  updateJob,
} from "../controllers/jobController.js";
import {
  createProposal,
  listJobProposals,
  listMyProposals,
  updateProposalStatus,
} from "../controllers/proposalController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listJobs);
router.post("/", requireRole("poster"), createJob);
router.get("/my-proposals", requireRole("freelancer"), listMyProposals);
router.get("/:jobId", getJobById);
router.patch("/:jobId", requireRole("poster"), updateJob);
router.delete("/:jobId", requireRole("poster"), deleteJob);

router.post("/:jobId/proposals", requireRole("freelancer"), createProposal);
router.get("/:jobId/proposals", listJobProposals);
router.patch("/:jobId/proposals/:proposalId/status", requireRole("poster"), updateProposalStatus);

export default router;
