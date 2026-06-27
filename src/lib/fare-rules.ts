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
