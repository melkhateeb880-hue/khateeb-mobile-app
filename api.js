import { Platform } from "react-native";

const browserHost =
  Platform.OS === "web" && typeof window !== "undefined"
    ? window.location.hostname
    : "172.20.10.3";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `http://${browserHost}:8004`;

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return response.json();
}

export function queryString(values) {
  const params = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value).trim())}`);
  return params.length ? `?${params.join("&")}` : "";
}
