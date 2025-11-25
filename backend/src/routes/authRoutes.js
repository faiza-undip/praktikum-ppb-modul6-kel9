import express from "express";
import { AuthController } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected route - untuk verify token (optional, bisa dipake untuk refresh user data)
router.get("/verify", authMiddleware, AuthController.verifyToken);

export default router;
