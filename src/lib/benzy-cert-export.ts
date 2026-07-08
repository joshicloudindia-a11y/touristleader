/**
 * Benzy certification — payload capture & export.
 *
 * Wire `makeCaptureCollector()` into `setBenzyCapture()` before running a booking
 * (search → runBookingFlow). Every request/response is collected, then
 * `buildCertBundle()` renders them into the exact numbered files Benzy expects
 * for submission:  1.ExpressSearch.json, 2.WebSettings.json, … 14.RetrieveBooking.json
 * in the "Method / Endpoint / Timestamp / Request Body / Response Body" text format.
 */
import type { BenzyExchange } from "./benzy-booking";
import { setBenzyCapture } from "./benzy-booking";

export interface CaptureCollector {
  exchanges: BenzyExchange[];
  /** Pass to setBenzyCapture(). */
  sink: (x: BenzyExchange) => void;
  /** Stop collecting (unregisters the global sink). */
  stop: () => void;
}

/** Create a collector and register it as the active Benzy capture sink. */
export function makeCaptureCollector(): CaptureCollector {
  const exchanges: BenzyExchange[] = [];
  const sink = (x: BenzyExchange) => exchanges.push(x);
  setBenzyCapture(sink);
  return { exchanges, sink, stop: () => setBenzyCapture(null) };
}

/** Derive the operation label used in the submission filename (e.g. "SmartPricer"). */
export function opLabel(x: BenzyExchange): string {
  if (/StartPay/i.test(x.name)) return /HP/i.test(x.name) ? "StartPay(BookingType-HP)" : "StartPay(BookingType-HB)";
  // Fall back to the last path segment of the endpoint (e.g. /Flights/SSR -> SSR).
  return x.endpoint.split("/").filter(Boolean).pop() || x.name;
}

/** Render one exchange in Benzy's reference text format. */
export function formatExchange(x: BenzyExchange, timestamp: string): string {
  return (
    `Method: ${x.method}\n` +
    `Endpoint: ${x.endpoint}\n` +
    `Timestamp: ${timestamp}\n` +
    `Request Body:\n${JSON.stringify(x.request, null, 2)}\n\n` +
    `Response Body:\n${JSON.stringify(x.response, null, 2)}\n`
  );
}

export interface CertFile {
  filename: string;
  content: string;
}

/**
 * Build the numbered submission files for one captured booking run.
 * `timestamps[i]` is optional (ISO string per exchange); omit for a blank stamp.
 */
export function buildCertBundle(exchanges: BenzyExchange[], timestamps?: string[]): CertFile[] {
  return exchanges.map((x, i) => ({
    filename: `${i + 1}.${opLabel(x)}.json`,
    content: formatExchange(x, timestamps?.[i] ?? ""),
  }));
}
