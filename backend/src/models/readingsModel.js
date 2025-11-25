import { supabase } from "../config/supabaseClient.js";
const TABLE = "sensor_readings";

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    temperature: row.temperature === null ? null : Number(row.temperature),
    threshold_value: row.threshold_value === null ? null : Number(row.threshold_value),
  };
}

export const ReadingsModel = {
  async list({ page = 1, pageSize = 5 } = {}) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Number(pageSize) || 5);
    const from = (p - 1) * ps;
    const to = from + ps - 1;

    const { data, error, count } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at", { count: "exact" })
      .order("recorded_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    return {
      items: (data || []).map(normalize),
      page: p,
      pageSize: ps,
      total,
      totalPages,
    };
  },

  async latest() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, temperature, threshold_value, recorded_at")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return normalize(data);
  },

  async create(payload) {
    const { temperature, threshold_value } = payload;
    if (typeof temperature !== "number") throw new Error("temperature must be a number");

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ temperature, threshold_value: threshold_value ?? null })
      .select("id, temperature, threshold_value, recorded_at")
      .single();
    if (error) throw error;
    return normalize(data);
  },
};
