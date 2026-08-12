import { NextRequest, NextResponse } from "next/server";
import { searchFlights as benzySearch, fareCalendar } from "@/lib/benzy";
import { amadeusConfigured, searchFlights as amadeusSearch } from "@/lib/amadeus";
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
  // Amadeus (1A SOAP) is the primary provider when credentials are set. If it
  // does not come back live, fall through to Benzy/Akbar rather than serving
  // generated fares — previously Benzy was unreachable whenever Amadeus was
  // configured, so AK results could never appear.
  const primary = amadeusConfigured() ? await amadeusSearch(q) : await benzySearch(q);
  let result = primary;
  if (!primary.live && amadeusConfigured()) {
    const secondary = await benzySearch(q);
    if (secondary.live) result = secondary;
  }
  return NextResponse.json({ query: q, flights: result.flights, calendar: fareCalendar(q), live: result.live });
}
