"use client";
import { useRef } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function prettyDate(iso: string) {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return {
    day: d.getDate(),
    mon: d.toLocaleDateString("en-IN", { month: "short" }),
    yr: String(d.getFullYear()).slice(2),
    wd: d.toLocaleDateString("en-IN", { weekday: "long" }),
  };
}

/** A fully-clickable date cell: a hidden native date input opens via showPicker(),
 *  with a styled display on top. Used in the home search widget and modify bar. */
export function DateField({
  label, value, min, onChange, placeholder, onActivate, compact = false,
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  onActivate?: () => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const p = prettyDate(value);
  const openPicker = () => {
    onActivate?.();
    const el = ref.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); }
  };
  return (
    <div className="relative h-full">
      <button type="button" onClick={openPicker} className={cn("flex h-full w-full flex-col items-start text-left transition-colors hover:bg-slate-50", compact ? "rounded-xl px-3 py-2" : "rounded-xl px-4 py-3")}>
        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
        {p ? (
          <>
            <span className={cn("flex items-baseline gap-1.5 leading-tight", compact ? "" : "mt-0.5")}>
              {!compact && <Calendar size={16} className="self-center text-brand" />}
              <span className={cn("font-bold text-slate-900", compact ? "text-base" : "text-2xl")}>{p.day}</span>
              <span className={cn("font-semibold text-slate-600", compact ? "text-xs" : "text-sm")}>{p.mon}&apos;{p.yr}</span>
            </span>
            <span className="text-xs text-slate-500">{p.wd}</span>
          </>
        ) : (
          <span className={cn("text-xs text-slate-400", compact ? "mt-1" : "mt-1.5")}>{placeholder}</span>
        )}
      </button>
      <input ref={ref} type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} aria-label={label} className="pointer-events-none absolute bottom-2 left-4 h-px w-px opacity-0" tabIndex={-1} />
    </div>
  );
}
