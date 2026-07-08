/**
 * Amadeus certification — the client's booking test cases.
 *
 * These mirror the four scenarios the client's Amadeus analyst asked us to cover:
 *
 *   TC1  One-way, 1 ADT              Sell → PNR → Price → TST → Issue → Cancel(void)
 *   TC2  Round-trip, 2 ADT + 1 CHD   + seat / meal / baggage SSRs
 *   TC3  One-way, 1 ADT              + paid seat with EMD issuance
 *   TC4  One-way, 1 ADT              Fare-family / booking-class upsell
 *
 * The passenger names, routes and dates below are representative test data — plug
 * in the client's exact test-sheet values before the certified run. Everything is
 * derived through the same builders as production (src/lib/amadeus-booking.ts), so
 * what we shape-verify here is exactly what the live flow will send.
 */
import type {
  BookingInput,
  BookingPassenger,
  BookingContact,
  SellSegment,
  FormOfPayment,
  AncillarySelection,
  PlannedMessage,
  BookingFlowResult,
} from "./amadeus-booking";
import { planBookingMessages, runBookingFlow } from "./amadeus-booking";
import { makeAmadeusCollector, buildAmadeusBundle, type CertFile } from "./amadeus-cert-export";

const CONTACT: BookingContact = {
  email: "test.traveller@touristleader.com",
  phone: "9876543210",
  phoneCountry: "91",
};

const CASH: FormOfPayment = { type: "CASH" };

const CARD: FormOfPayment = {
  type: "CARD",
  vendor: "VI",
  cardNumber: "4111111111111111",
  expiry: "1230",
  holder: "TEST TRAVELLER",
};

/** ddMMyy offset helper — N days from `base` (YYYY-MM-DD). */
export function plusDays(base: string, days: number): string {
  const d = new Date(base + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const ADT = (ref: number, title: string, first: string, last: string): BookingPassenger => ({
  ref,
  type: "ADT",
  title,
  firstName: first,
  lastName: last,
});
const CHD = (ref: number, title: string, first: string, last: string, dob: string): BookingPassenger => ({
  ref,
  type: "CHD",
  title,
  firstName: first,
  lastName: last,
  dateOfBirth: dob,
});

export interface AmadeusCertCase {
  id: string;
  title: string;
  input: BookingInput;
  ancillaries?: AncillarySelection[];
  emd?: boolean;
  cancel?: boolean;
}

/** Build all four cert cases relative to a base date (defaults 30 days out). */
export function buildCertCases(baseDate: string): AmadeusCertCase[] {
  const dep = plusDays(baseDate, 30);
  const ret = plusDays(baseDate, 37);

  const seg = (from: string, to: string, date: string, flightNumber: string, bookingClass: string, carrier = "AI"): SellSegment => ({
    from,
    to,
    departDate: date,
    carrier,
    flightNumber,
    bookingClass,
  });

  // TC1 — one-way, single adult, book + issue + cancel.
  const tc1: AmadeusCertCase = {
    id: "TC1",
    title: "One-way · 1 ADT · book → ticket → cancel",
    input: {
      passengers: [ADT(1, "MR", "ARJUN", "SHARMA")],
      contact: CONTACT,
      segments: [seg("DEL", "BOM", dep, "805", "M")],
      fop: CASH,
      receivedFrom: "TOURISTLEADER",
    },
    cancel: true,
  };

  // TC2 — round-trip, 2 ADT + 1 CHD, with seat/meal/bag ancillaries.
  const tc2Segments = [seg("DEL", "BOM", dep, "805", "M"), seg("BOM", "DEL", ret, "888", "M")];
  const tc2: AmadeusCertCase = {
    id: "TC2",
    title: "Round-trip · 2 ADT + 1 CHD · seat + meal + baggage",
    input: {
      passengers: [
        ADT(1, "MR", "ARJUN", "SHARMA"),
        ADT(2, "MRS", "PRIYA", "SHARMA"),
        CHD(3, "MSTR", "AARAV", "SHARMA", plusDays(baseDate, -2555)), // ~7y
      ],
      contact: CONTACT,
      segments: tc2Segments,
      fop: CARD,
      receivedFrom: "TOURISTLEADER",
    },
    ancillaries: [
      { paxRef: 1, segmentRef: 1, ssrType: "RQST", seat: "12A", carrier: "AI" },
      { paxRef: 2, segmentRef: 1, ssrType: "RQST", seat: "12B", carrier: "AI" },
      { paxRef: 1, segmentRef: 1, ssrType: "VGML", carrier: "AI" }, // vegetarian meal
      { paxRef: 1, segmentRef: 1, ssrType: "BAGS", quantity: 1, carrier: "AI", freetext: "1PC" }, // extra bag
    ],
  };

  // TC3 — one-way single adult, paid seat with EMD issuance.
  const tc3: AmadeusCertCase = {
    id: "TC3",
    title: "One-way · 1 ADT · paid seat + EMD",
    input: {
      passengers: [ADT(1, "MS", "MEERA", "IYER")],
      contact: CONTACT,
      segments: [seg("BLR", "DEL", dep, "504", "M")],
      fop: CARD,
      receivedFrom: "TOURISTLEADER",
    },
    ancillaries: [{ paxRef: 1, segmentRef: 1, ssrType: "RQST", seat: "1C", carrier: "AI" }],
    emd: true,
  };

  // TC4 — one-way single adult, fare-family / booking-class upsell.
  const tc4: AmadeusCertCase = {
    id: "TC4",
    title: "One-way · 1 ADT · fare-family upsell",
    input: {
      passengers: [ADT(1, "MR", "ROHAN", "GUPTA")],
      contact: CONTACT,
      segments: [seg("DEL", "BLR", dep, "503", "U")], // higher fare family / RBD
      fop: CASH,
      receivedFrom: "TOURISTLEADER",
    },
  };

  return [tc1, tc2, tc3, tc4];
}

/** Convenience: planned request envelopes for one case (for cert docs / shape checks). */
export function planCase(c: AmadeusCertCase): PlannedMessage[] {
  return planBookingMessages(c.input);
}

export interface CertRunResult {
  result: BookingFlowResult;
  files: CertFile[];
}

/**
 * Run ONE cert case live (opens a stateful session), capturing every SOAP
 * request/response into the numbered submission bundle. Requires a whitelisted
 * IP + booking-service entitlements on the WSAP — otherwise the flow returns
 * `sold:false` with the gateway fault recorded in `result.errors` (and the
 * captured envelopes still export, so the fault is fully documented).
 */
export async function runCertCase(c: AmadeusCertCase): Promise<CertRunResult> {
  const collector = makeAmadeusCollector();
  try {
    const result = await runBookingFlow(c.input, { ancillaries: c.ancillaries, emd: c.emd, cancel: c.cancel });
    return { result, files: buildAmadeusBundle(collector.exchanges) };
  } finally {
    collector.stop();
  }
}
