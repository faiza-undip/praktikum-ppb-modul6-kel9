import { supabase } from "../config/supabaseClient.js";
const TABLE = "users";

export const UsersModel = {
  async findByEmail(email) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, email, name, password_hash, created_at")
      .eq("email", email)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async create({ email, name, password_hash }) {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ email, name, password_hash })
      .select("id, email, name, created_at")
      .single();
    
    if (error) {
      if (error.code === '23505') { // unique constraint violation
        throw new Error("Email already exists");
      }
      throw error;
    }
    return data;
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, email, name, created_at")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },
};