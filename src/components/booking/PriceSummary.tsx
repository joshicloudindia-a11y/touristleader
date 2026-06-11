"use client";
import { useBooking } from "@/store/booking";
import { formatINR } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

export function PriceSummary({ cta }: { cta?: React.ReactNode }) {
  const { flight, fare, query, addOns } = useBooking();
  if (!flight || !fare || !query) return null;
  const pax = Math.max(1, query.travellers.adults + query.travellers.children);
  const base = Math.round(fare.price * 0.82) * pax;
  const taxes = fare.price * pax - base;
  const convenience = 299;
  const total = fare.price * pax + addOns + convenience;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h3 className="font-bold text-slate-900">Fare Summary</h3>
      <div className="mt-3 space-y-2 text-sm">
        <Row label={`Base fare × ${pax}`} value={formatINR(base)} />
        <Row label="Taxes & fees" value={formatINR(taxes)} />
        {addOns > 0 && <Row label="Add-ons (seats / meals)" value={formatINR(addOns)} />}
        <Row label="Convenience fee" value={formatINR(convenience)} />
        <div className="my-2 border-t border-dashed border-slate-200" />
        <Row label={<span className="font-bold text-slate-900">Total Amount</span>} value={<span className="text-lg font-extrabold text-slate-900">{formatINR(total)}</span>} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600"><ShieldCheck size={13} /> {fare.label} fare · {fare.cancellation}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
