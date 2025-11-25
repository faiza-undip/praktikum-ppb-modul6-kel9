import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "./config.js";

const TOKEN_KEY = "@iotwatch_token";
const USER_KEY = "@iotwatch_user";

async function request(path, options = {}) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL is not set");
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = "";
    try {
      message = (await response.clone().json())?.error;
    } catch {
      message = await response.text();
    }
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export const AuthService = {
  async login(email, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data.token && data.user) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  },

  async register(email, password, name) {
    const data = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });

    if (data.token && data.user) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
  },

  async logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUser() {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  },
};
