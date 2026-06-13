"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeftRight, Search, Sparkles, Plus, X, Check } from "lucide-react";
import { TRIP_TYPES, AIRLINES, GROUP_BOOKING_PERKS } from "@/lib/constants";
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

interface Leg { from: string; to: string; date: string; }

/** Resolve a free-text airline name or code to a known airline code (or the raw upper-cased input). */
function resolveAirline(input: string): string {
  const s = input.trim();
  if (!s) return "";
  const up = s.toUpperCase();
  const byCode = AIRLINES.find((a) => a.code === up);
  if (byCode) return byCode.code;
  const byName = AIRLINES.find((a) => a.name.toLowerCase().includes(s.toLowerCase()));
  return byName ? byName.code : up;
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
  // Advanced search + popular filter
  const [airline, setAirline] = useState("");
  const [nonStop, setNonStop] = useState(false);
  // Multi-city legs (only used when tripType === MULTI_CITY)
  const [legs, setLegs] = useState<Leg[]>([
    { from: "DEL", to: "BOM", date: tomorrow(3) },
    { from: "BOM", to: "", date: tomorrow(3) },
  ]);

  const roundTrip = tripType === "ROUND_TRIP";
  const multiCity = tripType === "MULTI_CITY";
  const group = tripType === "GROUP_BOOKING";

  const swap = () => { setFrom(to); setTo(from); };

  const updateLeg = (i: number, patch: Partial<Leg>) =>
    setLegs((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const swapLeg = (i: number) =>
    setLegs((ls) => ls.map((l, idx) => (idx === i ? { ...l, from: l.to, to: l.from } : l)));
  const addLeg = () =>
    setLegs((ls) => (ls.length >= 5 ? ls : [...ls, { from: ls[ls.length - 1].to || "", to: "", date: tomorrow(3) }]));
  const removeLeg = (i: number) => setLegs((ls) => (ls.length <= 2 ? ls : ls.filter((_, idx) => idx !== i)));

  const search = () => {
    const params = new URLSearchParams({ tripType, cabinClass, passengerType });

    if (multiCity) {
      const valid = legs.filter((l) => l.from && l.to);
      params.set("from", valid[0]?.from || from);
      params.set("to", valid[0]?.to || to);
      params.set("departDate", valid[0]?.date || departDate);
      params.set("legs", valid.map((l) => `${l.from}-${l.to}-${l.date}`).join("~"));
    } else {
      params.set("from", from);
      params.set("to", to);
      params.set("departDate", departDate);
      if (roundTrip && returnDate) params.set("returnDate", returnDate);
    }

    params.set("adults", String(travellers.adults));
    params.set("children", String(travellers.children));
    params.set("infants", String(travellers.infants));
    if (airline.trim()) params.set("airline", resolveAirline(airline));
    if (nonStop) params.set("nonstop", "1");
    if (group) params.set("group", "1");

    router.push(`/flights/search?${params.toString()}`);
  };

  return (
    <div className="relative rounded-2xl bg-white pb-14 shadow-2xl ring-1 ring-slate-100">
      {/* Product tabs (in-card nav, MMT style). */}
      <div className="border-b border-slate-100 px-4 pt-4 sm:px-6">
        <ProductTabs active="flights" />
      </div>

      <div className="px-4 pt-4 sm:px-6">
        {/* Trip type + hint */}
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {TRIP_TYPES.map((t) => {
            const badge = (t as { badge?: string }).badge;
            return (
              <div key={t.id} className="flex items-center">
                <button
                  onClick={() => setTripType(t.id as TripType)}
                  className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors", tripType === t.id ? "text-brand" : "text-slate-600 hover:bg-slate-100")}
                >
                  <span className={cn("grid h-4 w-4 place-items-center rounded-full border-2", tripType === t.id ? "border-brand" : "border-slate-300")}>
                    {tripType === t.id && <span className="h-2 w-2 rounded-full bg-brand" />}
                  </span>
                  {t.label}
                  {badge && <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-600">{badge}</span>}
                </button>
                <InfoPopup title={t.label} className="-ml-1 mr-1"><p className="text-sm text-slate-700">{t.info}</p></InfoPopup>
              </div>
            );
          })}
          <span className="ml-auto hidden text-sm font-medium text-slate-500 sm:block">Book International and Domestic Flights</span>
        </div>

        {/* ===== Multi-city: stacked legs ===== */}
        {multiCity ? (
          <div className="mt-3 space-y-2">
            {legs.map((leg, i) => (
              <div key={i} className="grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-y-0 md:grid-cols-12 md:divide-x">
                <div className="relative grid grid-cols-2 md:col-span-5">
                  <div className="min-w-0 border-r border-slate-200 pr-5"><AirportSelect label="From City" value={leg.from} onChange={(v) => updateLeg(i, { from: v })} /></div>
                  <div className="min-w-0 pl-5"><AirportSelect label="To City" value={leg.to} onChange={(v) => updateLeg(i, { to: v })} align="right" /></div>
                  <button onClick={() => swapLeg(i)} className="absolute left-1/2 top-1/2 z-20 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-brand shadow-md transition-transform hover:rotate-180" aria-label="Swap"><ArrowLeftRight size={16} /></button>
                </div>
                <div className="md:col-span-3"><DateField label="Depart" value={leg.date} min={tomorrow(0)} onChange={(v) => updateLeg(i, { date: v })} /></div>
                <div className="flex items-center justify-center px-3 py-3 md:col-span-4">
                  {i === 0 ? (
                    <div className="w-full"><TravellerSelect travellers={travellers} cabinClass={cabinClass} onChange={(t, c) => { setTravellers(t); setCabinClass(c); }} /></div>
                  ) : i === legs.length - 1 ? (
                    <div className="flex w-full items-center justify-between gap-2">
                      <button onClick={addLeg} disabled={legs.length >= 5} className="flex items-center gap-1.5 rounded-lg border border-brand px-4 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand/5 disabled:opacity-40">
                        <Plus size={16} /> ADD ANOTHER CITY
                      </button>
                      {legs.length > 2 && (
                        <button onClick={() => removeLeg(i)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500" aria-label="Remove leg"><X size={18} /></button>
                      )}
                    </div>
                  ) : (
                    <button onClick={() => removeLeg(i)} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500" aria-label="Remove leg"><X size={18} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ===== One-way / Round-trip / Group field box ===== */
          <div className="mt-3 grid grid-cols-1 divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-y-0 md:grid-cols-12 md:divide-x">
            <div className="relative grid grid-cols-2 border-b border-slate-200 sm:border-b-0 md:col-span-5">
              <div className="min-w-0 border-r border-slate-200 pr-5"><AirportSelect label="From City" value={from} onChange={setFrom} /></div>
              <div className="min-w-0 pl-5"><AirportSelect label="To City" value={to} onChange={setTo} align="right" /></div>
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
                onActivate={() => { if (!roundTrip && !group) { setTripType("ROUND_TRIP"); if (!returnDate) setReturnDate(tomorrow(7)); } }}
                onChange={(v) => { setReturnDate(v); if (v && !group) setTripType("ROUND_TRIP"); }}
              />
            </div>
            <div className="sm:col-span-2 sm:border-t sm:border-slate-200 md:col-span-3 md:border-t-0">
              <TravellerSelect travellers={travellers} cabinClass={cabinClass} onChange={(t, c) => { setTravellers(t); setCabinClass(c); }} />
            </div>
          </div>
        )}

        {/* ===== Advanced Search (airline name or code) ===== */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand/10 text-brand"><Sparkles size={15} /></span>
            <h3 className="text-sm font-bold text-slate-800">Advanced Search</h3>
            <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold lowercase text-violet-600">new</span>
          </div>
          <p className="mt-0.5 pl-9 text-xs text-slate-500">Use Advanced Search to find all the flights using airline name or airline code</p>
          <div className="mt-2 pl-9">
            <label className="mb-1 block text-xs font-bold text-slate-600">Airline name or code <span className="font-medium text-slate-400">(Optional)</span></label>
            <input
              list="airline-list"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              placeholder="Enter airline (eg. IndiGo or 6E)"
              className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <datalist id="airline-list">
              {AIRLINES.map((a) => <option key={a.code} value={a.name}>{a.code}</option>)}
            </datalist>
          </div>
        </div>

        {/* ===== Group Booking perks  OR  Fare type + Non-Stop ===== */}
        {group ? (
          <div className="mt-4">
            <p className="text-sm font-bold text-slate-800">Unlock Exclusive Perks with Group Bookings!</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GROUP_BOOKING_PERKS.map((p) => (
                <span key={p} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  <Check size={14} className="text-amber-600" /> {p}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <>
            <SpecialFares value={passengerType} onChange={setPassengerType} />
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Popular Filter</span>
              <button
                onClick={() => setNonStop((v) => !v)}
                className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors", nonStop ? "border-brand bg-brand/5 text-brand" : "border-slate-200 text-slate-600 hover:border-slate-300")}
              >
                <span className={cn("grid h-4 w-4 place-items-center rounded-full border-2", nonStop ? "border-brand" : "border-slate-300")}>
                  {nonStop && <span className="h-2 w-2 rounded-full bg-brand" />}
                </span>
                Non-Stop
              </button>
            </div>
          </>
        )}
      </div>

      {/* Search button straddling bottom edge */}
      <button onClick={search} className="absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-brand to-sky-500 px-14 py-4 text-lg font-bold tracking-wide text-white shadow-xl shadow-brand/30 transition-transform hover:scale-[1.03] active:scale-95">
        <Search size={18} /> SEARCH
      </button>
    </div>
  );
}
