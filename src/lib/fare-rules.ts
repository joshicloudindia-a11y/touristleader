import { AIRPORTS } from "./constants";
import type { TravellerCount } from "./types";

/** Both endpoints within India → domestic (no passport/ID mandate for the passenger form). */
export function isDomesticRoute(fromCode: string, toCode: string): boolean {
  const country = (code: string) => AIRPORTS.find((a) => a.code === code)?.country;
  return country(fromCode) === "India" && country(toCode) === "India";
}

export type PaxType = "Adult" | "Child" | "Infant";

/** Per-passenger type list in form order: adults, then children, then infants. */
export function paxTypes(t: TravellerCount): PaxType[] {
  return [
    ...Array.from({ length: t.adults }, () => "Adult" as const),
    ...Array.from({ length: t.children }, () => "Child" as const),
    ...Array.from({ length: t.infants }, () => "Infant" as const),
  ];
}

/** Seats that actually get a seat assignment = adults + children (infants travel on lap). */
export function seatablePax(t: TravellerCount): number {
  return Math.max(1, t.adults + t.children);
}

/** Infants travel on a lap and pay a reduced fare — 10% of the adult fare. */
export const INFANT_FARE_RATE = 0.1;

/** Passengers billed at the full fare = adults + children (infants pay the reduced infant rate). */
export function payingPax(t: TravellerCount): number {
  return Math.max(1, t.adults + t.children);
}

/** Reduced fare for a single infant, given the full per-passenger (adult) fare. */
export function infantFarePerHead(perPaxFare: number): number {
  return Math.round(perPaxFare * INFANT_FARE_RATE);
}

/**
 * Air-fare breakdown for a traveller mix, given the combined per-passenger (adult)
 * fare across all legs. Adults & children pay the full fare; infants pay the reduced
 * infant rate (lap, no seat). base/taxes use the same 82/18 split as the rest of the app.
 */
export function fareBreakdown(t: TravellerCount, perPaxFare: number) {
  const paying = payingPax(t);
  const infants = Math.max(0, t.infants || 0);
  const base = Math.round(perPaxFare * 0.82) * paying;
  const taxes = perPaxFare * paying - base;
  const infantPer = infantFarePerHead(perPaxFare);
  const infantTotal = infantPer * infants;
  return {
    paying,
    infants,
    infantPer,
    infantTotal,
    base,
    taxes,
    /** Total air fare across every passenger and leg (adults + children + infants). */
    fareTotal: perPaxFare * paying + infantTotal,
  };
}

/** Whole years between a date of birth and a reference date. */
export function ageOnDate(dobISO: string, onISO: string): number {
  const b = new Date(dobISO);
  const d = new Date(onISO);
  let age = d.getFullYear() - b.getFullYear();
  const m = d.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--;
  return age;
}

/** Human age band for each passenger type (shown next to the form heading). */
export const TYPE_AGE_LABEL: Record<PaxType, string> = {
  Adult: "18+ yrs",
  Child: "2–18 yrs",
  Infant: "under 2 yrs",
};

/**
 * Validate a date of birth against its passenger type's age band, measured on the
 * travel date: Infant 0–2, Child 2–18, Adult 18+. Returns "" when valid.
 */
export function dobErrorForType(dobISO: string, type: PaxType, travelISO: string): string {
  if (!dobISO) return "Date of birth is required";
  if (new Date(dobISO) > new Date()) return "Date can't be in the future";
  const age = ageOnDate(dobISO, travelISO);
  if (age < 0) return "Enter a valid date of birth";
  if (type === "Infant" && age >= 2) return "Infant must be under 2 years on the travel date";
  if (type === "Child" && (age < 2 || age >= 18)) return "Child must be 2–18 years on the travel date";
  if (type === "Adult" && age < 18) return "Adult must be 18 years or older on the travel date";
  return "";
}

/**
 * Effective seat charge after fare inclusions:
 *  - Your Choice → any seat free (free preferred seat)
 *  - Comfort     → standard seat free; window/premium still charge
 */
export function seatCharge(fareId: string | undefined, basePrice: number): number {
  if (fareId === "YOUR_CHOICE") return 0;
  if (fareId === "COMFORT") return basePrice <= 200 ? 0 : basePrice;
  return basePrice;
}

/**
 * Effective meal charge after fare inclusions:
 *  - Your Choice → any meal free
 *  - Comfort     → veg / non-veg free; premium meals still charge
 */
export function mealCharge(fareId: string | undefined, mealId: string, basePrice: number): number {
  if (fareId === "YOUR_CHOICE") return 0;
  if (fareId === "COMFORT") return mealId === "veg" || mealId === "nonveg" ? 0 : basePrice;
  return basePrice;
}
