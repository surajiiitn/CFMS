import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getMyProfile, getUserReviews, updateMyProfile } from "../controllers/userController.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.get("/:userId/reviews", getUserReviews);

export default router;
