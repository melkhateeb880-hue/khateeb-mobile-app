import { Platform } from "react-native";

const browserHost =
  Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.hostname
    : "172.20.10.3";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${browserHost}:8004`;

const TOKEN_KEY = "khateeb_access_token";
let accessToken =
  Platform.OS === "web" && typeof localStorage !== "undefined"
    ? localStorage.getItem(TOKEN_KEY) || ""
    : "";

function saveToken(token) {
  accessToken = token || "";
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

export function apiLogout() {
  if (accessToken) {
    request("/api/auth/logout", { method: "POST" }, 0).catch(() => {});
  }
  saveToken("");
}

async function request(path, options = {}, retries = 2) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      saveToken("");
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.dispatchEvent(new Event("khateeb-session-expired"));
      }
      throw new Error(body?.detail || "Your session has expired. Please sign in again.");
    }
    if (!response.ok) throw new Error(body?.detail || `Request failed: ${response.status}`);
    return body;
  } catch (error) {
    if (retries > 0 && !(error.message || "").toLowerCase().includes("session")) {
      await new Promise((resolve) => setTimeout(resolve, (3 - retries) * 700));
      return request(path, options, retries - 1);
    }
    throw error;
  }
}

export async function apiLogin(username, password) {
  const body = await request(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ username, password }) },
    0
  );
  saveToken(body.access_token);
  return body;
}

export async function apiGet(path) {
  const body = await request(path);
  if (body && Object.prototype.hasOwnProperty.call(body, "data")) {
    if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
      return { ...body.data, _updated_at: body.updated_at };
    }
    return body.data;
  }
  return body;
}

export function queryString(values) {
  const params = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`);
  return params.length ? `?${params.join("&")}` : "";
}
