import { Router } from "express";
import {
  login,
  me,
  sendRegistrationOtp,
  switchRole,
  verifyRegistrationOtp,
} from "../controllers/authController.js";
import { authRateLimiter, otpRateLimiter } from "../middleware/rateLimiters.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/send-otp", otpRateLimiter, sendRegistrationOtp);
router.post("/verify-otp", authRateLimiter, verifyRegistrationOtp);
router.post("/login", authRateLimiter, login);
router.get("/me", requireAuth, me);
router.patch("/switch-role", requireAuth, switchRole);

export default router;
