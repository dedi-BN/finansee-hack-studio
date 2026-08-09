import type { DashboardStats, Hack, HackInput } from "../types";

export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export function getStats(): Promise<DashboardStats> {
  return request<DashboardStats>("/stats");
}

export interface HackListParams {
  search?: string;
  category?: string;
  status?: string;
  age?: string;
  employment?: string;
  sort?: string;
  order?: string;
  limit?: number;
}

export function listHacks(params: HackListParams = {}): Promise<Hack[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, String(value));
  });
  const qs = query.toString();
  return request<Hack[]>(`/hacks${qs ? `?${qs}` : ""}`);
}

export function getHack(id: number): Promise<Hack> {
  return request<Hack>(`/hacks/${id}`);
}

export function createHack(data: HackInput): Promise<Hack> {
  return request<Hack>("/hacks", { method: "POST", body: JSON.stringify(data) });
}

export function updateHack(id: number, data: HackInput): Promise<Hack> {
  return request<Hack>(`/hacks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteHack(id: number): Promise<void> {
  return request<void>(`/hacks/${id}`, { method: "DELETE" });
}
