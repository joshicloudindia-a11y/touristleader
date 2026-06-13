"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Flight, SearchQuery, TripType, CabinClass } from "@/lib/types";
import { SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { InfoPopup } from "@/components/ui/InfoPopup";
import { FareCalendar } from "./FareCalendar";
import { FilterPanel, DEFAULT_FILTERS, type Filters } from "./FilterPanel";
import { FlightCard } from "./FlightCard";
import { ModifySearch } from "./ModifySearch";

function parseUrlQuery(sp: URLSearchParams): SearchQuery {
  return {
    tripType: (sp.get("tripType") as TripType) || "ONE_WAY",
    from: sp.get("from") || "DEL",
    to: sp.get("to") || "BOM",
    departDate: sp.get("departDate") || new Date().toISOString().slice(0, 10),
    returnDate: sp.get("returnDate") || undefined,
    cabinClass: (sp.get("cabinClass") as CabinClass) || "Economy",
    travellers: { adults: Number(sp.get("adults") || 1), children: Number(sp.get("children") || 0), infants: Number(sp.get("infants") || 0) },
    passengerType: sp.get("passengerType") || "REGULAR",
  };
}

interface ApiResponse {
  query: SearchQuery;
  flights: Flight[];
  calendar: { date: string; price: number; cheapest?: boolean }[];
  live: boolean;
}

function timeBucket(iso: string) {
  const h = new Date(iso).getHours();
  if (h < 6) return "early";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function SkeletonCard() {
  return <div className="shimmer h-28 rounded-2xl bg-white shadow-sm" />;
}

export function SearchResults() {
  const sp = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("cheapest");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const qs = sp.toString();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/flights/search?${qs}`)
      .then((r) => r.json())
      .then((d: ApiResponse) => {
        setData(d);
        // Seed filters from the search query: Advanced Search airline + Non-Stop popular filter.
        const seeded: Filters = { ...DEFAULT_FILTERS };
        const airline = sp.get("airline");
        if (airline) seeded.airlines = [airline.toUpperCase()];
        if (sp.get("nonstop") === "1") seeded.stops = [0];
        setFilters(seeded);
      })
      .finally(() => setLoading(false));
  }, [qs]);

  const priceBounds = useMemo<[number, number]>(() => {
    if (!data?.flights.length) return [1000, 50000];
    const prices = data.flights.map((f) => f.basePrice);
    return [Math.min(...prices), Math.max(...prices)];
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.flights.filter((f) => {
      if (filters.stops.length && !filters.stops.includes(Math.min(f.stops, 2))) return false;
      if (filters.airlines.length && !filters.airlines.includes(f.airlineCode)) return false;
      if (filters.maxPrice && f.basePrice > filters.maxPrice) return false;
      if (filters.refundable === "yes" && !f.refundable) return false;
      if (filters.refundable === "no" && f.refundable) return false;
      if (filters.departBuckets.length && !filters.departBuckets.includes(timeBucket(f.departTime))) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "fastest": return a.durationMinutes - b.durationMinutes;
        case "earliest": return new Date(a.departTime).getTime() - new Date(b.departTime).getTime();
        case "latest": return new Date(b.departTime).getTime() - new Date(a.departTime).getTime();
        default: return a.basePrice - b.basePrice;
      }
    });
    return list;
  }, [data, filters, sort]);

  const onSelectDate = (date: string) => {
    const params = new URLSearchParams(qs);
    params.set("departDate", date);
    router.push(`/flights/search?${params.toString()}`);
  };

  const q = data?.query;
  const urlQuery = parseUrlQuery(sp);

  return (
    <>
    {/* MakeMyTrip-style editable modify-search bar under the header */}
    <ModifySearch query={urlQuery} />

    <div className="mx-auto max-w-7xl px-4 py-5">
      {data && !data.live && (
        <div className="mb-3">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Demo fares — live Benzy API pending IP whitelist</span>
        </div>
      )}

      {/* Fare calendar */}
      {data && <FareCalendar days={data.calendar} selected={q!.departDate} onSelect={onSelectDate} />}

      {/* Sort + filter bar */}
      <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm no-scrollbar">
        <button onClick={() => setShowFilters(true)} className="lg:hidden flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700">
          <SlidersHorizontal size={15} /> Filters
        </button>
        <span className="shrink-0 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</span>
        {SORT_OPTIONS.map((s) => (
          <div key={s.id} className="flex shrink-0 items-center">
            <button onClick={() => setSort(s.id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors", sort === s.id ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100")}>
              {s.label}
            </button>
            <InfoPopup title={s.label}><p className="text-sm text-slate-700">{s.info}</p></InfoPopup>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-5">
        {/* Desktop filters */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <FilterPanel filters={filters} onChange={setFilters} priceBounds={priceBounds} />
        </aside>

        {/* Results */}
        <div className="flex-1 space-y-3">
          {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="text-lg font-bold text-slate-800">No flights match your filters</p>
              <button onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-2 text-sm font-semibold text-brand hover:underline">Clear filters</button>
            </div>
          )}
          {!loading && (
            <>
              <p className="text-sm text-slate-500">{filtered.length} flight{filtered.length !== 1 ? "s" : ""} found</p>
              {filtered.map((f) => (
                <FlightCard key={f.id} flight={f} query={q!} />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Filters</h3>
              <button onClick={() => setShowFilters(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-200"><X size={18} /></button>
            </div>
            <FilterPanel filters={filters} onChange={setFilters} priceBounds={priceBounds} />
            <button onClick={() => setShowFilters(false)} className="mt-3 w-full rounded-xl bg-brand py-3 font-semibold text-white">Show {filtered.length} flights</button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
