import { Router } from "express";
import authRoutes from "./authRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import jobRoutes from "./jobRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import userRoutes from "./userRoutes.js";
import workspaceRoutes from "./workspaceRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CFMS backend is healthy",
    data: { uptime: process.uptime() },
  });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/jobs", jobRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);

export default router;
