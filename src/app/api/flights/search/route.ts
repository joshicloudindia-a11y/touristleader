import { NextRequest, NextResponse } from "next/server";
import { searchFlights, fareCalendar } from "@/lib/benzy";
import type { SearchQuery, TripType, CabinClass } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseQuery(sp: URLSearchParams): SearchQuery {
  return {
    tripType: (sp.get("tripType") as TripType) || "ONE_WAY",
    from: sp.get("from") || "DEL",
    to: sp.get("to") || "BOM",
    departDate: sp.get("departDate") || new Date().toISOString().slice(0, 10),
    returnDate: sp.get("returnDate") || undefined,
    cabinClass: (sp.get("cabinClass") as CabinClass) || "Economy",
    travellers: {
      adults: Number(sp.get("adults") || 1),
      children: Number(sp.get("children") || 0),
      infants: Number(sp.get("infants") || 0),
    },
    passengerType: sp.get("passengerType") || "REGULAR",
  };
}

export async function GET(req: NextRequest) {
  const q = parseQuery(req.nextUrl.searchParams);
  const { flights, live } = await searchFlights(q);
  return NextResponse.json({ query: q, flights, calendar: fareCalendar(q), live });
}
