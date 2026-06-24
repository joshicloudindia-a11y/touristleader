"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane, Ticket, Loader2, ArrowRight, FileText, Share2, Check, Luggage, ShieldAlert, Users, CreditCard, Bus as BusIcon, BedDouble, Armchair, MapPin, Star, XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AirlineLogo } from "@/components/AirlineLogo";
import { useAuth } from "@/store/auth";
import { formatINR, formatDate, formatTime, formatDuration, cn } from "@/lib/utils";
import { AIRPORTS } from "@/lib/constants";
import { buildInvoiceHtml, openInvoice, shareBooking, type InvoiceData } from "@/lib/invoice";

type Kind = "FLIGHT" | "BUS" | "HOTEL";
interface Pax { fullName?: string; idType?: string; idNumber?: string; gender?: string; seatId?: string; age?: string }
interface FData {
  airlineCode?: string; airlineName?: string; flightNumber?: string; departTime?: string; arriveTime?: string; durationMinutes?: number; stops?: number; cabinBaggage?: string; checkInBaggage?: string;
  operator?: string; busType?: string; seatIds?: string[]; boarding?: { name?: string; time?: string }; dropping?: { name?: string }; date?: string;
  name?: string; area?: string; city?: string; starRating?: number; roomName?: string; nights?: number; checkIn?: string; checkOut?: string; rooms?: number; image?: string;
}
interface Booking {
  id: string; bookingRef: string; pnr: string | null; status: string; bookingType?: Kind;
  origin: string; destination: string; departDate: string; returnDate: string | null;
  cabinClass: string; fareType: string; adults: number; children: number; infants: number;
  baseFare: number; taxes: number; addOns: number; totalAmount: number;
  serviceCharge?: number; gstType?: string | null; igst?: number; cgst?: number; sgst?: number;
  contactEmail: string; contactPhone: string; paymentId: string | null; createdAt: string;
  passengers?: Pax[] | null;
  flightData?: FData | null;
}

const FARE_LABELS: Record<string, string> = { FEE_SAVER: "Fee Saver", REGULAR: "Regular", COMFORT: "Comfort", YOUR_CHOICE: "Your Choice" };
const KIND_LABEL: Record<Kind, string> = { FLIGHT: "Flight", BUS: "Bus", HOTEL: "Hotel" };
function city(code: string) { return AIRPORTS.find((a) => a.code === code)?.city || code; }
const kindOf = (b: Booking): Kind => (b.bookingType as Kind) || "FLIGHT";

export default function MyTripsPage() {
  const router = useRouter();
  const { user, fetched, fetchMe } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => { if (!fetched) fetchMe(); }, [fetched, fetchMe]);
  useEffect(() => {
    if (!fetched) return;
    if (!user) { setLoading(false); return; }
    fetch("/api/bookings", { cache: "no-store" }).then((r) => r.json()).then((d) => setBookings(d.bookings || [])).finally(() => setLoading(false));
  }, [fetched, user]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(""), 2500); return () => clearTimeout(t); }, [toast]);

  const fareMath = (b: Booking) => {
    const f = b.flightData || {}; const kind = kindOf(b); const total = b.totalAmount || 0;
    let base: number; let taxes = b.taxes || 0;
    let pax = Math.max(1, b.adults + b.children);
    if (kind === "FLIGHT") { base = (b.baseFare || 0) * pax; taxes = (b.taxes || 0) * pax; }
    else if (kind === "HOTEL") { base = (b.baseFare || 0) * (f.nights || 1); }
    else { base = b.baseFare || 0; pax = b.adults || f.seatIds?.length || 1; } // BUS: stored base is full seats fare
    const addOns = b.addOns || 0;
    const serviceCharge = b.serviceCharge || 0;
    const gstTotal = (b.igst || 0) + (b.cgst || 0) + (b.sgst || 0);
    const convenience = Math.max(0, total - base - taxes - addOns - serviceCharge - gstTotal);
    return { kind, pax, base, taxes, addOns, convenience, serviceCharge, igst: b.igst || 0, cgst: b.cgst || 0, sgst: b.sgst || 0, gstTotal, gstType: b.gstType, total };
  };

  // ---- title/route helpers ----
  const routeLabel = (b: Booking) => kindOf(b) === "HOTEL" ? (b.flightData?.name || b.cabinClass) : `${city(b.origin)} → ${city(b.destination)}`;

  const invoice = (b: Booking) => {
    const m = fareMath(b); const f = b.flightData || {}; const kind = m.kind;
    let detailsTitle = "Flight Details"; let detailLines: string[] = [];
    if (kind === "BUS") {
      detailsTitle = "Bus Details";
      detailLines = [
        `<b>${f.operator || "-"}</b>`,
        `${f.busType || b.cabinClass}`,
        `${city(b.origin)} &rarr; ${city(b.destination)}`,
        `${formatDate(b.departDate)}${f.departTime ? ` &middot; ${formatTime(f.departTime)}` : ""}`,
        `Seats: ${(f.seatIds || []).join(", ") || "-"} &middot; ${m.pax} passenger${m.pax > 1 ? "s" : ""}`,
        `Boarding: ${f.boarding?.name || "-"}${f.boarding?.time ? ` (${f.boarding.time})` : ""}`,
      ];
    } else if (kind === "HOTEL") {
      detailsTitle = "Stay Details";
      detailLines = [
        `<b>${f.name || "-"}</b>`,
        `${f.area ? `${f.area}, ` : ""}${f.city || ""}`,
        `${f.roomName || b.cabinClass} &middot; ${f.nights || 1} night${(f.nights || 1) > 1 ? "s" : ""}`,
        `${f.checkIn || formatDate(b.departDate)} &rarr; ${f.checkOut || ""}`,
        `${f.rooms || 1} room${(f.rooms || 1) > 1 ? "s" : ""} &middot; ${m.pax} guest${m.pax > 1 ? "s" : ""}`,
      ];
    } else {
      detailLines = [
        `<b>${f.airlineName || "-"} ${f.flightNumber || ""}</b>`,
        `${city(b.origin)} (${b.origin}) &rarr; ${city(b.destination)} (${b.destination})`,
        `${formatDate(b.departDate)}${f.departTime ? ` &middot; ${formatTime(f.departTime)}` : ""}`,
        `${b.cabinClass} &middot; ${FARE_LABELS[b.fareType] || b.fareType} &middot; ${m.pax} traveller${m.pax > 1 ? "s" : ""}`,
      ];
    }
    const data: InvoiceData = {
      ref: b.bookingRef, pnr: b.pnr || "—", kind, detailsTitle, detailLines,
      name: b.passengers?.[0]?.fullName || "Guest", email: b.contactEmail, phone: b.contactPhone,
      dateLabel: formatDate(b.departDate), pax: m.pax,
      base: m.base, taxes: m.taxes, addOns: m.addOns, convenience: m.convenience, total: m.total,
      serviceCharge: m.serviceCharge, igst: m.igst, cgst: m.cgst, sgst: m.sgst,
      invDate: formatDate(b.createdAt),
    };
    openInvoice(buildInvoiceHtml(data, window.location.origin), b.bookingRef);
  };

  const share = (b: Booking) => {
    shareBooking(`My Tourist Leader ${KIND_LABEL[kindOf(b)].toLowerCase()} booking: ${routeLabel(b)} on ${formatDate(b.departDate)}. Ref ${b.bookingRef}.`, () => setToast("Trip link copied"));
  };

  const [cancelling, setCancelling] = useState("");
  const cancelBooking = async (b: Booking) => {
    if (!confirm(`Cancel this booking (${b.bookingRef})? Your refund will go back to your wallet or original payment method.`)) return;
    setCancelling(b.id);
    try {
      const res = await fetch("/api/bookings/cancel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingRef: b.bookingRef }) });
      const d = await res.json();
      if (res.ok) {
        setBookings((bs) => bs.map((x) => x.id === b.id ? { ...x, status: "CANCELLED" } : x));
        setSelected((s) => s && s.id === b.id ? { ...s, status: "CANCELLED" } : s);
        setToast(d.message || "Booking cancelled");
      } else setToast(d.error || "Could not cancel");
    } catch { setToast("Network error"); } finally { setCancelling(""); }
  };

  const CardIcon = ({ b }: { b: Booking }) => {
    const k = kindOf(b);
    if (k === "FLIGHT" && b.flightData?.airlineCode) return <AirlineLogo code={b.flightData.airlineCode} size={36} />;
    const Icon = k === "BUS" ? BusIcon : k === "HOTEL" ? BedDouble : Plane;
    return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand"><Icon size={18} /></span>;
  };

  return (
    <>
      <Header active="flights" />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900"><Ticket size={24} className="text-brand" /> My Trips</h1>
          {loading ? (
            <div className="mt-10 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>
          ) : !user ? (
            <Empty title="Please log in to see your trips" sub="Your bookings are linked to your account." cta="Go to Home" onClick={() => router.push("/")} />
          ) : bookings.length === 0 ? (
            <Empty title="No trips yet" sub="Your confirmed bookings will appear here." cta="Start booking" onClick={() => router.push("/")} />
          ) : (
            <div className="mt-5 space-y-3">
              {bookings.map((b) => {
                const k = kindOf(b);
                return (
                  <button key={b.id} onClick={() => setSelected(b)} className="block w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md hover:ring-brand/40">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">{KIND_LABEL[k]}</span>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", b.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>{b.status}</span>
                        <span className="hidden text-slate-400 sm:inline">{b.bookingRef}</span>
                      </div>
                      <span className="text-sm font-extrabold text-slate-900">{formatINR(b.totalAmount)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <CardIcon b={b} />
                      <div className="flex-1 min-w-0 font-bold text-slate-900"><span className="truncate">{routeLabel(b)}</span></div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-slate-800">{formatDate(b.departDate)}</p>
                        <p className="text-xs text-slate-400">{b.flightData?.departTime ? formatTime(b.flightData.departTime) : b.cabinClass}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-right text-xs font-semibold text-brand">View details →</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Trip Details">
        {selected && (() => {
          const b = selected; const m = fareMath(b); const f = b.flightData || {}; const k = m.kind;
          return (
            <div>
              <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
                <div><p className="text-xs text-slate-400">Booking ID</p><p className="font-bold text-slate-900">{b.bookingRef}</p></div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-bold", b.status === "CANCELLED" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700")}>{b.status}</span>
                <div className="text-right"><p className="text-xs text-slate-400">{k === "BUS" ? "Ticket" : k === "HOTEL" ? "Conf. No." : "PNR"}</p><p className="font-bold text-brand">{b.pnr || "—"}</p></div>
              </div>

              {/* Journey block by type */}
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                {k === "HOTEL" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand"><BedDouble size={18} /></span>
                      <div className="flex-1 min-w-0"><p className="truncate font-bold text-slate-900">{f.name}</p><p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} /> {f.area ? `${f.area}, ` : ""}{f.city}{f.starRating ? <span className="ml-1 flex items-center gap-0.5 text-amber-500"><Star size={10} className="fill-amber-400" /> {f.starRating}</span> : null}</p></div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Cell label="Check-in" value={f.checkIn || formatDate(b.departDate)} />
                      <Cell label="Check-out" value={f.checkOut || "-"} />
                      <Cell label="Room" value={f.roomName || b.cabinClass} />
                      <Cell label="Nights" value={`${f.nights || 1}`} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      {k === "FLIGHT" && f.airlineCode ? <AirlineLogo code={f.airlineCode} size={36} /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand/10 text-brand">{k === "BUS" ? <BusIcon size={18} /> : <Plane size={18} />}</span>}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-bold text-slate-900">{k === "BUS" ? f.operator : `${f.airlineName || ""} ${f.flightNumber || ""}`}</p>
                        <p className="text-xs text-slate-500">{formatDate(b.departDate)} · {k === "BUS" ? (f.busType || b.cabinClass) : `${FARE_LABELS[b.fareType] || b.fareType} · ${b.cabinClass}`}</p>
                      </div>
                    </div>
                    {f.departTime && f.arriveTime && (
                      <div className="mt-3 flex items-center justify-between">
                        <div><p className="text-lg font-extrabold text-slate-900">{formatTime(f.departTime)}</p><p className="text-xs text-slate-400">{city(b.origin)}</p></div>
                        <div className="flex-1 px-3 text-center">
                          <p className="text-[11px] text-slate-400">{f.durationMinutes ? formatDuration(f.durationMinutes) : ""}</p>
                          <div className="my-1 flex items-center"><span className="h-px flex-1 bg-slate-200" />{k === "BUS" ? <BusIcon size={12} className="mx-1 text-slate-400" /> : <Plane size={12} className="mx-1 text-slate-400" />}<span className="h-px flex-1 bg-slate-200" /></div>
                          <p className="text-[11px] font-medium text-slate-500">{k === "FLIGHT" ? ((f.stops ?? 0) === 0 ? "Non-stop" : `${f.stops} stop(s)`) : "Direct"}</p>
                        </div>
                        <div className="text-right"><p className="text-lg font-extrabold text-slate-900">{formatTime(f.arriveTime)}</p><p className="text-xs text-slate-400">{city(b.destination)}</p></div>
                      </div>
                    )}
                    {k === "BUS" && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <Cell label="Seats" value={(f.seatIds || []).join(", ") || "-"} />
                        <Cell label="Boarding" value={`${f.boarding?.name || "-"}${f.boarding?.time ? ` · ${f.boarding.time}` : ""}`} />
                        <Cell label="Dropping" value={f.dropping?.name || "-"} />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Travellers */}
              {b.passengers && b.passengers.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400"><Users size={13} /> {k === "HOTEL" ? "Guest" : "Travellers"}</p>
                  <div className="space-y-1.5">
                    {b.passengers.map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-semibold text-slate-800">{p.fullName || `Passenger ${i + 1}`}</span>
                        <span className="text-xs text-slate-400">{p.seatId ? `Seat ${p.seatId}` : p.age ? `Age ${p.age}` : `${p.idType || ""} ${p.idNumber || ""}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fare */}
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Fare summary</p>
                <Row label={`Base fare${k === "FLIGHT" ? ` × ${m.pax}` : ""}`} value={formatINR(m.base)} />
                <Row label="Taxes & fees" value={formatINR(m.taxes)} />
                {m.addOns > 0 && <Row label="Add-ons" value={formatINR(m.addOns)} />}
                {m.convenience > 0 && <Row label="Convenience fee" value={formatINR(m.convenience)} />}
                {m.serviceCharge > 0 && <Row label="Service charge" value={formatINR(m.serviceCharge)} />}
                {m.igst > 0 && <Row label="IGST" value={formatINR(m.igst)} />}
                {m.cgst > 0 && <Row label="CGST" value={formatINR(m.cgst)} />}
                {m.sgst > 0 && <Row label="SGST" value={formatINR(m.sgst)} />}
                <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 font-extrabold text-slate-900"><span>Total Paid</span><span>{formatINR(m.total)}</span></div>
                {b.paymentId && <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400"><CreditCard size={12} /> Payment ID: {b.paymentId}</p>}
              </div>

              {/* Info */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {k === "FLIGHT" && <div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Luggage size={14} className="text-brand" /> Baggage</p><p className="mt-1 text-xs text-slate-500">Cabin {f.cabinBaggage || "7 kg"} · Check-in {f.checkInBaggage || "15 kg"}</p></div>}
                {k === "BUS" && <div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><Armchair size={14} className="text-brand" /> Seats</p><p className="mt-1 text-xs text-slate-500">{(f.seatIds || []).join(", ") || "-"} · reach boarding 15 min early</p></div>}
                {k === "HOTEL" && <div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><BedDouble size={14} className="text-brand" /> Check-in / out</p><p className="mt-1 text-xs text-slate-500">2 PM / 11 AM · carry a valid ID</p></div>}
                <div className="rounded-xl bg-slate-50 p-3"><p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800"><ShieldAlert size={14} className="text-brand" /> Cancellation</p><p className="mt-1 text-xs text-slate-500">Operator rules apply. Convenience fee non-refundable.</p></div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => invoice(b)}><FileText size={16} /> View Invoice</Button>
                <Button variant="outline" onClick={() => share(b)}><Share2 size={16} /> Share Trip</Button>
              </div>
              {b.status === "CANCELLED" ? (
                <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2.5 text-center text-sm font-semibold text-slate-500">This booking is cancelled.</p>
              ) : (
                <Button variant="outline" className="mt-2 w-full !border-rose-200 !text-rose-600 hover:!bg-rose-50" onClick={() => cancelBooking(b)} disabled={cancelling === b.id}>
                  {cancelling === b.id ? <><Loader2 size={16} className="animate-spin" /> Cancelling…</> : <><XCircle size={16} /> Cancel booking</>}
                </Button>
              )}
            </div>
          );
        })()}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl animate-fade-up">
          <Check size={15} className="text-emerald-400" /> {toast}
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between text-sm text-slate-600"><span>{label}</span><span className="font-semibold text-slate-800">{value}</span></div>;
}
function Cell({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] text-slate-400">{label}</p><p className="truncate text-sm font-semibold text-slate-800">{value}</p></div>;
}
function Empty({ title, sub, cta, onClick }: { title: string; sub: string; cta: string; onClick: () => void }) {
  return (
    <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><Ticket size={26} /></span>
      <p className="mt-4 text-lg font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{sub}</p>
      <Button className="mt-5" onClick={onClick}>{cta}</Button>
    </div>
  );
}
