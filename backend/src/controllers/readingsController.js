import { ReadingsModel } from "../models/readingsModel.js";

export const ReadingsController = {
  async list(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 5;
      const result = await ReadingsModel.list({ page, pageSize });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  async latest(req, res) {
    try { res.json(await ReadingsModel.latest()); }
    catch (error) { res.status(500).json({ error: error.message }); }
  },
  async create(req, res) {
    try { res.status(201).json(await ReadingsModel.create(req.body)); }
    catch (error) { res.status(400).json({ error: error.message }); }
  },
};
