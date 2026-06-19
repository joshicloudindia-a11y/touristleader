"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plane, BedDouble, Bus, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { formatINR, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Booking { id: string; bookingRef: string; pnr: string | null; bookingType: string; source?: string; status: string; paymentStatus: string; origin: string; destination: string; departDate: string; totalAmount: number; contactEmail: string; contactPhone: string; createdAt: string; cabinClass: string }
const TABS = [["ALL", "All"], ["FLIGHT", "Flights"], ["HOTEL", "Hotels"], ["BUS", "Bus"]] as const;
const ICON: Record<string, React.ElementType> = { FLIGHT: Plane, HOTEL: BedDouble, BUS: Bus };

// Which API/data source produced the booking.
const SOURCE_META: Record<string, { label: string; cls: string }> = {
  AMADEUS: { label: "Amadeus", cls: "bg-emerald-100 text-emerald-700" },
  BENZY: { label: "Benzy", cls: "bg-blue-100 text-blue-700" },
  BDSD: { label: "BDSD", cls: "bg-indigo-100 text-indigo-700" },
  DEMO: { label: "Demo", cls: "bg-slate-100 text-slate-500" },
};
function sourceMeta(s?: string) { return SOURCE_META[(s || "DEMO").toUpperCase()] || SOURCE_META.DEMO; }

export default function AdminBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/bookings${tab !== "ALL" ? `?type=${tab}` : ""}`, { cache: "no-store" }).then((r) => r.json()).then((d) => setRows(d.bookings || [])).finally(() => setLoading(false));
  }, [tab]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return rows;
    return rows.filter((b) => `${b.bookingRef} ${b.pnr} ${b.contactEmail} ${b.origin} ${b.destination}`.toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <AdminShell title="Bookings">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100">
          {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", tab === id ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-50")}>{label}</button>)}
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
          <Search size={15} className="text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, email, route…" className="w-44 bg-transparent text-sm outline-none sm:w-56" />
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16 text-slate-400"><Loader2 className="animate-spin" /></div> : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-slate-100 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">API / Source</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((b) => { const Icon = ICON[b.bookingType] || Plane; return (
                <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold", sourceMeta(b.source).cls)}>{sourceMeta(b.source).label}</span></td>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{b.bookingRef}</p><p className="text-xs text-slate-400">{b.pnr || ""}</p></td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600"><Icon size={11} /> {b.bookingType}</span></td>
                  <td className="px-4 py-3 text-slate-700">{b.origin} → {b.destination}<p className="text-xs text-slate-400">{b.cabinClass}</p></td>
                  <td className="px-4 py-3"><p className="text-slate-700">{b.contactEmail}</p><p className="text-xs text-slate-400">{b.contactPhone}</p></td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(b.departDate)}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900">{formatINR(b.totalAmount)}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{b.status}</span><p className="mt-0.5 text-[10px] text-slate-400">{b.paymentStatus}</p></td>
                </tr>
              ); })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">No bookings found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
