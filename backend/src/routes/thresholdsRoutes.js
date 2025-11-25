import express from "express";
import { ThresholdsController } from "../controllers/thresholdsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes - butuh authentication
router.get("/", authMiddleware, ThresholdsController.list);
router.post("/", authMiddleware, ThresholdsController.create);
router.get("/latest", authMiddleware, ThresholdsController.latest);

export default router;