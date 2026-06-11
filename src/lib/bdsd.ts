/**
 * BDSD Technology (Tourista) Bus API client.
 * Panel: https://api.bdsd.technology  (agent login provides API docs + token).
 *
 * The API is reachable, but the exact bus endpoints (Authenticate, city list,
 * AvailableTrips/Search, SeatLayout, BlockTicket, BookTicket) are documented in
 * the agent dashboard. Until those are confirmed, live calls are gated behind
 * BUS_LIVE=1 and we fall back to realistic generated data so the UI is fully
 * functional. Fill in the TODO endpoint paths from the BDSD docs to go live.
 */
import { generateBuses } from "./mock-bus";
import type { BusSearchQuery, BusTrip } from "./bus-types";

const cfg = {
  baseUrl: process.env.BDSD_BASE_URL || "https://api.bdsd.technology/api",
  userId: process.env.BDSD_USER_ID || "",
  password: process.env.BDSD_PASSWORD || "",
};
const TIMEOUT = 12000;

async function postJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`BDSD ${url} -> ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/** Step 1 — authenticate to get an access token. (Endpoint TBD from BDSD docs.) */
export async function bdsdAuthenticate(): Promise<string | null> {
  try {
    // TODO: confirm path & payload from BDSD dashboard, e.g. `${cfg.baseUrl}/Authenticate`.
    const data = await postJson<{ Token?: string; token?: string; access_token?: string }>(
      `${cfg.baseUrl}/Authenticate`,
      { UserId: cfg.userId, Password: cfg.password }
    );
    return data.Token || data.token || data.access_token || null;
  } catch (err) {
    console.warn("[bdsd] auth failed:", (err as Error).message);
    return null;
  }
}

/** Step 2 — search available bus trips. Falls back to generated data. */
export async function searchBuses(q: BusSearchQuery): Promise<{ buses: BusTrip[]; live: boolean }> {
  if (process.env.BUS_LIVE !== "1") {
    return { buses: generateBuses(q), live: false };
  }
  const token = await bdsdAuthenticate();
  if (token) {
    try {
      // TODO: confirm path & payload, e.g. `${cfg.baseUrl}/Bus/AvailableTrips`.
      const data = await postJson<{ Trips?: unknown[] }>(
        `${cfg.baseUrl}/Bus/AvailableTrips`,
        { SourceId: q.from, DestinationId: q.to, JourneyDate: q.date },
        token
      );
      const buses = normalizeBuses(data, q);
      if (buses.length) return { buses, live: true };
    } catch (err) {
      console.warn("[bdsd] bus search failed, using fallback:", (err as Error).message);
    }
  }
  return { buses: generateBuses(q), live: false };
}

function normalizeBuses(data: { Trips?: unknown[] }, _q: BusSearchQuery): BusTrip[] {
  // Map BDSD response → BusTrip[] once a real sample is available.
  if (!Array.isArray(data?.Trips)) return [];
  return [];
}
