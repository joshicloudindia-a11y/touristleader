"use client";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { CABIN_CLASSES } from "@/lib/constants";
import type { CabinClass, TravellerCount } from "@/lib/types";
import { cn } from "@/lib/utils";

function Counter({ label, sub, value, onChange, min = 0 }: { label: string; sub: string; value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
          className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-600 disabled:opacity-40 hover:border-brand hover:text-brand">
          <Minus size={14} />
        </button>
        <span className="w-5 text-center text-sm font-bold">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)}
          className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-600 hover:border-brand hover:text-brand">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function TravellerSelect({
  travellers,
  cabinClass,
  onChange,
  compact = false,
}: {
  travellers: TravellerCount;
  cabinClass: CabinClass;
  onChange: (t: TravellerCount, c: CabinClass) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const total = travellers.adults + travellers.children + travellers.infants;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={cn("flex h-full w-full flex-col items-start text-left transition-colors hover:bg-slate-50", compact ? "rounded-xl px-3 py-2" : "rounded-xl px-4 py-3")}>
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{compact ? "Passenger & Class" : "Travellers & Class"}</span>
        <span className={cn("flex items-baseline gap-1 font-bold leading-tight text-slate-900", compact ? "text-base" : "mt-0.5 text-2xl")}>{total}<span className={cn("font-semibold text-slate-500", compact ? "text-xs" : "text-sm")}>Traveller{total > 1 ? "s" : ""}</span></span>
        <span className="truncate text-xs text-slate-500">{cabinClass}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <Counter label="Adults" sub="12+ years" value={travellers.adults} min={1} onChange={(n) => onChange({ ...travellers, adults: n }, cabinClass)} />
          <Counter label="Children" sub="2–12 years" value={travellers.children} onChange={(n) => onChange({ ...travellers, children: n }, cabinClass)} />
          <Counter label="Infants" sub="Under 2 years" value={travellers.infants} onChange={(n) => onChange({ ...travellers, infants: n }, cabinClass)} />
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Cabin Class</p>
            <div className="grid grid-cols-3 gap-2">
              {CABIN_CLASSES.map((c) => (
                <button key={c} type="button" onClick={() => onChange(travellers, c as CabinClass)}
                  className={cn("rounded-lg border px-2 py-2 text-xs font-semibold transition-colors", cabinClass === c ? "border-brand bg-brand/10 text-brand" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="mt-4 w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Done</button>
        </div>
      )}
    </div>
  );
}
