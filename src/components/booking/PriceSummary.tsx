"use client";
import { useEffect } from "react";
import { useBooking } from "@/store/booking";
import { useAuth } from "@/store/auth";
import { useBilling } from "@/lib/useBilling";
import { promoDiscount } from "@/lib/offers";
import { formatINR } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { ServiceChargeLines, GstStateSelect } from "@/components/billing/Billing";

export function PriceSummary({ cta, editableState = true }: { cta?: React.ReactNode; editableState?: boolean }) {
  const { flight, fare, query, extraFlights, addOns, promoCode, agentMarkup, customerState, setCustomerState } = useBooking();
  const { user } = useAuth();
  const { config, quote } = useBilling();

  // prefill the billing state from the user's profile once
  useEffect(() => { if (editableState && !customerState && user?.state) setCustomerState(user.state); }, [user, customerState, editableState, setCustomerState]);

  if (!flight || !fare || !query) return null;
  const pax = Math.max(1, query.travellers.adults + query.travellers.children);
  // Combined per-passenger fare across all legs (return / multi-city); 1 leg for one-way.
  const legCount = 1 + extraFlights.length;
  const perPax = fare.price + extraFlights.reduce((s, e) => s + e.fare.price, 0);
  const base = Math.round(perPax * 0.82) * pax;
  const taxes = perPax * pax - base;
  const convenience = 299;
  const discount = promoDiscount(promoCode, perPax * pax + addOns); // promo applies to fare + add-ons
  const subtotal = perPax * pax + addOns + convenience - discount;
  const q = quote(subtotal, customerState);
  const total = subtotal + q.addon + agentMarkup;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <h3 className="font-bold text-slate-900">Fare Summary</h3>
      <div className="mt-3 space-y-2 text-sm">
        <Row label={`Base fare × ${pax}${legCount > 1 ? ` · ${legCount} flights` : ""}`} value={formatINR(base)} />
        <Row label="Taxes & fees" value={formatINR(taxes)} />
        {addOns > 0 && <Row label="Add-ons (seats / meals)" value={formatINR(addOns)} />}
        <Row label="Convenience fee" value={formatINR(convenience)} />
        {discount > 0 && <Row label={<span className="font-semibold text-emerald-600">Promo ({promoCode})</span>} value={<span className="font-semibold text-emerald-600">− {formatINR(discount)}</span>} />}
        {editableState
          ? <div className="py-1"><GstStateSelect value={customerState} onChange={setCustomerState} /></div>
          : customerState && <Row label="Billing state" value={customerState} />}
        <ServiceChargeLines q={q} config={config} />
        {agentMarkup > 0 && <Row label="Agent service charge" value={formatINR(agentMarkup)} />}
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
