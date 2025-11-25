import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UsersModel } from "../models/usersModel.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "7d"; // Token berlaku 7 hari

export const AuthController = {
  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validasi input
      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ error: "Email, password, and name are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      // Cek apakah email sudah ada
      const existingUser = await UsersModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Buat user baru
      const user = await UsersModel.create({ email, name, password_hash });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validasi input
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      // Cari user berdasarkan email
      const user = await UsersModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async verifyToken(req, res) {
    try {
      // Token sudah diverifikasi oleh middleware
      // User info sudah ada di req.user
      const user = await UsersModel.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ error: error.message });
    }
  },
};
