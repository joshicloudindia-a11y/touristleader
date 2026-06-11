"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Search } from "lucide-react";
import { TRIP_TYPES } from "@/lib/constants";
import type { CabinClass, TravellerCount, TripType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { InfoPopup } from "@/components/ui/InfoPopup";
import { AirportSelect } from "./AirportSelect";
import { TravellerSelect } from "./TravellerSelect";
import { ProductTabs } from "./ProductTabs";
import { SpecialFares } from "./SpecialFares";
import { DateField } from "./DateField";

function tomorrow(offset = 1) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function SearchWidget() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("ONE_WAY");
  const [passengerType, setPassengerType] = useState("REGULAR");
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("BOM");
  const [departDate, setDepartDate] = useState(tomorrow(3));
  const [returnDate, setReturnDate] = useState("");
  const [cabinClass, setCabinClass] = useState<CabinClass>("Economy");
  const [travellers, setTravellers] = useState<TravellerCount>({ adults: 1, children: 0, infants: 0 });

  const swap = () => { setFrom(to); setTo(from); };

  const search = () => {
    const params = new URLSearchParams({
      tripType, from, to, departDate, cabinClass,
      adults: String(travellers.adults), children: String(travellers.children), infants: String(travellers.infants),
      passengerType,
    });
    if (tripType === "ROUND_TRIP" && returnDate) params.set("returnDate", returnDate);
    router.push(`/flights/search?${params.toString()}`);
  };

  const roundTrip = tripType === "ROUND_TRIP";

  return (
    <div className="relative rounded-2xl bg-white pb-14 shadow-2xl ring-1 ring-slate-100">
      {/* Product tabs (in-card nav, MMT style).
          Mobile/tablet: horizontal slide (swipe). Desktop: full single row. */}
      <div className="border-b border-slate-100 px-4 pt-4 sm:px-6">
        <ProductTabs active="flights" />
      </div>

      <div className="px-4 pt-4 sm:px-6">
        {/* Trip type + hint */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {TRIP_TYPES.map((t) => (
            <div key={t.id} className="flex items-center">
              <button
                onClick={() => setTripType(t.id as TripType)}
                className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors", tripType === t.id ? "text-brand" : "text-slate-600 hover:bg-slate-100")}
              >
                <span className={cn("grid h-4 w-4 place-items-center rounded-full border-2", tripType === t.id ? "border-brand" : "border-slate-300")}>
                  {tripType === t.id && <span className="h-2 w-2 rounded-full bg-brand" />}
                </span>
                {t.label}
              </button>
              <InfoPopup title={t.label} className="-ml-1 mr-1"><p className="text-sm text-slate-700">{t.info}</p></InfoPopup>
            </div>
          ))}
          <span className="ml-auto hidden text-sm font-medium text-slate-500 sm:block">Book International and Domestic Flights</span>
        </div>

        {/* Field box */}
        <div className="mt-3 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-y-0 md:grid-cols-12 md:divide-x">
          <div className="relative grid grid-cols-2 border-b border-slate-200 sm:border-b-0 md:col-span-5">
            <div className="min-w-0 border-r border-slate-200 pr-5"><AirportSelect label="From" value={from} onChange={setFrom} /></div>
            <div className="min-w-0 pl-5"><AirportSelect label="To" value={to} onChange={setTo} align="right" /></div>
            <button onClick={swap} className="absolute left-1/2 top-1/2 z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-brand shadow-md transition-transform hover:rotate-180" aria-label="Swap airports">
              <ArrowLeftRight size={16} />
            </button>
          </div>
          <div className="border-b border-slate-200 sm:border-r sm:border-b-0 md:col-span-2 md:border-b-0">
            <DateField label="Departure" value={departDate} min={tomorrow(0)} onChange={setDepartDate} />
          </div>
          <div className="border-b border-slate-200 sm:border-b-0 md:col-span-2">
            <DateField
              label="Return"
              value={returnDate}
              min={departDate}
              placeholder="Tap to add a return date for bigger discounts"
              onActivate={() => { if (!roundTrip) { setTripType("ROUND_TRIP"); if (!returnDate) setReturnDate(tomorrow(7)); } }}
              onChange={(v) => { setReturnDate(v); if (v) setTripType("ROUND_TRIP"); }}
            />
          </div>
          <div className="sm:col-span-2 sm:border-t sm:border-slate-200 md:col-span-3 md:border-t-0">
            <TravellerSelect travellers={travellers} cabinClass={cabinClass} onChange={(t, c) => { setTravellers(t); setCabinClass(c); }} />
          </div>
        </div>

        {/* Special fares */}
        <SpecialFares value={passengerType} onChange={setPassengerType} />

        {tripType === "MULTI_CITY" && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Multi-City lets you add multiple destinations in one booking — ideal for business & long trips. Add more legs on the next step.</p>
        )}
      </div>

      {/* Search button straddling bottom edge */}
      <button onClick={search} className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-sky-500 px-14 py-4 text-lg font-bold tracking-wide text-white shadow-xl shadow-brand/30 transition-transform hover:scale-[1.03] active:scale-95">
        <Search size={18} /> SEARCH
      </button>
    </div>
  );
}
