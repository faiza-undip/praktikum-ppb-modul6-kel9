import { supabase } from "../config/supabaseClient.js";
const TABLE = "threshold_settings";

function normalize(row) {
  if (!row) return row;
  return { ...row, value: row.value === null ? null : Number(row.value) };
}

export const ThresholdsModel = {
  async list({ page = 1, pageSize = 5, userId } = {}) {
    const p = Math.max(1, Number(page) || 1);
    const ps = Math.max(1, Number(pageSize) || 5);
    const from = (p - 1) * ps;
    const to = from + ps - 1;

    let query = supabase
      .from(TABLE)
      .select("id, value, note, created_at, user_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    // Filter by user_id if provided (optional - bisa semua user lihat semua threshold)
    // Uncomment jika mau filter per user
    // if (userId) {
    //   query = query.eq("user_id", userId);
    // }

    const { data, error, count } = await query;

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

  async latest({ userId } = {}) {
    let query = supabase
      .from(TABLE)
      .select("id, value, note, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(1);

    // Filter by user_id if provided
    // if (userId) {
    //   query = query.eq("user_id", userId);
    // }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return normalize(data);
  },

  async create(payload) {
    const { value, note, userId } = payload;
    if (typeof value !== "number") throw new Error("value must be a number");

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        value,
        note: note?.slice(0, 180) ?? null,
        user_id: userId ?? null,
      })
      .select("id, value, note, created_at, user_id")
      .single();

    if (error) throw error;
    return normalize(data);
  },
};
