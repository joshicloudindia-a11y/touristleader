"use client";
import { Plane } from "lucide-react";
import { useBooking } from "@/store/booking";
import { AirlineLogo } from "@/components/AirlineLogo";
import { formatTime, formatDuration, formatDate } from "@/lib/utils";

export function FlightSummaryCard() {
  const { flight, fare } = useBooking();
  if (!flight) return null;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <AirlineLogo code={flight.airlineCode} size={40} />
        <div className="flex-1">
          <p className="font-bold text-slate-900">{flight.airlineName} <span className="text-xs font-normal text-slate-400">{flight.flightNumber}</span></p>
          <p className="text-xs text-slate-500">{formatDate(flight.departTime)}</p>
        </div>
        {fare && <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{fare.label}</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-xl font-extrabold text-slate-900">{formatTime(flight.departTime)}</p>
          <p className="text-xs text-slate-400">{flight.from}</p>
        </div>
        <div className="flex-1 px-3 text-center">
          <p className="text-[11px] text-slate-400">{formatDuration(flight.durationMinutes)}</p>
          <div className="my-1 flex items-center"><span className="h-px flex-1 bg-slate-200" /><Plane size={12} className="mx-1 text-slate-400" /><span className="h-px flex-1 bg-slate-200" /></div>
          <p className="text-[11px] font-medium text-slate-500">{flight.stops === 0 ? "Non-stop" : `${flight.stops} stop(s)`}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-slate-900">{formatTime(flight.arriveTime)}</p>
          <p className="text-xs text-slate-400">{flight.to}</p>
        </div>
      </div>
    </div>
  );
}
