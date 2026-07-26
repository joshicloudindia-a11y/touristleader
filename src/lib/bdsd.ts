/**
 * BDSD Technology (Tourista) Bus API client.
 * Panel: https://api.bdsd.technology  (agent login → dashboard hosts the API docs).
 *
 * STATUS — live credentials received 2026-07-26, endpoint contract still unknown.
 *
 * Verified by probing on 2026-07-26:
 *   - `${BDSD_BASE_URL}/` responds 200 ("Welcome to Travel Technology Solution
 *     API"), so the API root is real and reachable from our network.
 *   - No OpenAPI/Swagger is exposed: /swagger, /swagger/v1/swagger.json and
 *     /docs all 404.
 *   - The guessed auth paths below all return 404: /Authenticate, /authenticate,
 *     /login, /token, /GetToken, /v1/authenticate, /agent/authenticate,
 *     /Bus/Authenticate. The real paths are published only in the dashboard.
 *   - No public documentation exists for this API anywhere on the web.
 *
 * So every path in this file is still an UNVERIFIED GUESS and will 404. Do not
 * treat the calls below as an integration. To finish, pull the request/response
 * spec from the dashboard (Authenticate, city list, AvailableTrips/Search,
 * SeatLayout, BoardingPoints, BlockTicket, BookTicket, Cancel, BookingDetails)
 * and replace both the paths and `normalizeBuses`.
 *
 * Live calls stay gated behind BUS_LIVE=1 and fall back to generated data, so
 * the UI is fully functional meanwhile. Keep BUS_LIVE=0 until the contract is
 * confirmed: these are production credentials and a successful BookTicket
 * debits the agency wallet for real.
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
