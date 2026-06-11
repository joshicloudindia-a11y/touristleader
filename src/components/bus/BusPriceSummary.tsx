"use client";
import { useBusBooking, BUS_CONVENIENCE } from "@/store/bus-booking";
import { formatINR } from "@/lib/utils";
import { Armchair } from "lucide-react";

export function BusPriceSummary({ cta }: { cta?: React.ReactNode }) {
  const { bus, seats, fareTotal } = useBusBooking();
  if (!bus) return null;
  const taxes = Math.round(fareTotal * 0.05);
  const total = fareTotal + taxes + BUS_CONVENIENCE;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h3 className="font-bold text-slate-900">Fare Summary</h3>
      <div className="mt-3 space-y-2 text-sm">
        <Row label={`Base fare (${seats.length} seat${seats.length > 1 ? "s" : ""})`} value={formatINR(fareTotal)} />
        <Row label="Taxes & fees" value={formatINR(taxes)} />
        <Row label="Convenience fee" value={formatINR(BUS_CONVENIENCE)} />
        <div className="my-2 border-t border-dashed border-slate-200" />
        <Row label={<span className="font-bold text-slate-900">Total Amount</span>} value={<span className="text-lg font-extrabold text-slate-900">{formatINR(total)}</span>} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400"><Armchair size={13} /> Seats: {seats.map((s) => s.id).join(", ")}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return <div className="flex items-center justify-between text-slate-600"><span>{label}</span><span className="font-semibold text-slate-800">{value}</span></div>;
}
