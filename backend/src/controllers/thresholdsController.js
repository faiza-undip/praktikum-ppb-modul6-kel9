import { ThresholdsModel } from "../models/thresholdsModel.js";

export const ThresholdsController = {
  async list(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 5;

      // user info dari middleware (req.user.userId)
      const userId = req.user?.userId;

      const result = await ThresholdsModel.list({ page, pageSize, userId });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async latest(req, res) {
    try {
      const userId = req.user?.userId;
      res.json(await ThresholdsModel.latest({ userId }));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      // Ambil userId dari token yang sudah diverifikasi
      const userId = req.user?.userId;

      // Tambahkan userId ke payload
      const payload = {
        ...req.body,
        userId,
      };

      res.status(201).json(await ThresholdsModel.create(payload));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
