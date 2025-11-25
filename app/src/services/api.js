import { BACKEND_URL } from "./config.js";
import { AuthService } from "./auth.js";

function qs(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  });
  const s = u.toString();
  return s ? `?${s}` : "";
}

async function request(path, options = {}) {
  if (!BACKEND_URL) throw new Error("BACKEND_URL is not set in app.json");
  
  const token = await AuthService.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  
  const response = await fetch(`${BACKEND_URL}${path}`, {
    headers,
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

export const Api = {
  getSensorReadings({ page = 1, pageSize = 5 } = {}) {
    return request(`/api/readings${qs({ page, pageSize })}`);
  },
  getThresholds({ page = 1, pageSize = 5 } = {}) {
    return request(`/api/thresholds${qs({ page, pageSize })}`);
  },
  createThreshold(payload) {
    return request("/api/thresholds", { method: "POST", body: JSON.stringify(payload) });
  },
};