/**
 * Amadeus certification — SOAP payload capture & export.
 *
 * Wire `makeAmadeusCollector()` into the booking flow (it registers itself as the
 * active `setAmadeusCapture()` sink) before running `runBookingFlow()`. Every SOAP
 * request/response envelope is collected, then `buildAmadeusBundle()` renders them
 * into numbered files for the certification submission, in the
 * "SOAPAction / Timestamp / Request Envelope / Response Envelope" format:
 *
 *   1.Air_SellFromRecommendation.xml
 *   2.PNR_AddMultiElements.xml
 *   3.FOP_CreateFormOfPayment.xml
 *   ... 8.DocIssuance_IssueTicket.xml
 *
 * This is the Amadeus analogue of benzy-cert-export.ts. Because the exchanges are
 * the *live* request+response envelopes, the bundle is exactly what the client's
 * Amadeus certification analyst reviews (Headers / Payload / Response per step).
 */
import type { AmadeusExchange } from "./amadeus-booking";
import { setAmadeusCapture } from "./amadeus-booking";

export interface AmadeusCollector {
  exchanges: AmadeusExchange[];
  sink: (x: AmadeusExchange) => void;
  /** Stop collecting (unregisters the global sink). */
  stop: () => void;
}

/** Create a collector and register it as the active Amadeus capture sink. */
export function makeAmadeusCollector(): AmadeusCollector {
  const exchanges: AmadeusExchange[] = [];
  const sink = (x: AmadeusExchange) => exchanges.push(x);
  setAmadeusCapture(sink);
  return { exchanges, sink, stop: () => setAmadeusCapture(null) };
}

/** Filename-safe operation label (e.g. "PNR_AddMultiElements(commit)" -> "PNR_AddMultiElements_commit"). */
export function opLabel(x: AmadeusExchange): string {
  return x.name.replace(/[()]/g, "").replace(/[^A-Za-z0-9_]+/g, "_").replace(/_+$/g, "");
}

/** Render one exchange in the certification submission text format. */
export function formatExchange(x: AmadeusExchange, timestamp: string): string {
  return (
    `Operation: ${x.name}\n` +
    `SOAPAction: ${x.action}\n` +
    `Timestamp: ${timestamp}\n` +
    `\n===== REQUEST =====\n${x.request}\n` +
    `\n===== RESPONSE =====\n${x.response}\n`
  );
}

export interface CertFile {
  filename: string;
  content: string;
}

/** Build the numbered submission files for one captured booking run. */
export function buildAmadeusBundle(exchanges: AmadeusExchange[], timestamps?: string[]): CertFile[] {
  return exchanges.map((x, i) => ({
    filename: `${i + 1}.${opLabel(x)}.xml`,
    content: formatExchange(x, timestamps?.[i] ?? ""),
  }));
}
