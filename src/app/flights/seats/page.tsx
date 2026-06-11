"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Armchair } from "lucide-react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/Button";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { useBooking } from "@/store/booking";
import { MEALS } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";

const COLS = ["A", "B", "C", "D", "E", "F"];
const ROWS = 20;

type SeatState = "available" | "booked" | "premium" | "selected";

function seatPrice(row: number, col: string) {
  if (row <= 3) return 600; // front premium
  if (col === "A" || col === "F") return 350; // window
  if (row >= 11 && row <= 13) return 450; // emergency rows
  return 200;
}

export default function SeatsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pax, setPax] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [seats, setSeats] = useState<Record<number, string>>({});
  const { setSeat, fare } = useBooking();

  // deterministic "booked" seats
  const booked = useMemo(() => {
    const s = new Set<string>();
    for (let r = 1; r <= ROWS; r++) for (const c of COLS) if ((r * 7 + c.charCodeAt(0)) % 5 === 0) s.add(`${r}${c}`);
    return s;
  }, []);

  useEffect(() => {
    setMounted(true);
    const st = useBooking.getState();
    if (!st.flight || !st.query) { router.replace("/"); return; }
    const names = st.passengers.length ? st.passengers.map((p) => p.fullName || "Passenger") : ["Passenger"];
    setPax(names);
    setSeats(st.seats);
  }, [router]);

  if (!mounted) return null;

  const chosen = new Set(Object.values(seats));
  const pick = (id: string, price: number) => {
    if (booked.has(id) || (chosen.has(id) && seats[active] !== id)) return;
    const next = { ...seats, [active]: id };
    setSeats(next);
    setSeat(active, id, price);
    recalc(next);
    if (active < pax.length - 1) setActive(active + 1);
  };

  const recalc = (s: Record<number, string>) => {
    let seatTotal = 0;
    Object.values(s).forEach((id) => {
      const r = parseInt(id);
      const c = id.replace(/\d/g, "");
      seatTotal += seatPrice(r, c);
    });
    const mealTotal = Object.values(useBooking.getState().meals).reduce((acc, mid) => {
      return acc + (MEALS.find((m) => m.id === mid)?.price || 0);
    }, 0);
    useBooking.setState({ addOns: seatTotal + mealTotal });
  };

  const proceed = () => router.push("/flights/meals");

  return (
    <>
      <Header active="flights" />
      <main className="flex-1 bg-slate-100">
        <div className="border-b border-slate-200 bg-white py-4"><Stepper current={2} /></div>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              {/* passenger tabs */}
              <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
                {pax.map((name, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={cn("rounded-xl border px-3 py-2 text-left text-sm", active === i ? "border-brand bg-brand/10" : "border-slate-200")}>
                    <span className="block text-xs text-slate-400">Passenger {i + 1}</span>
                    <span className="font-semibold text-slate-800">{seats[i] || "Select seat"}</span>
                  </button>
                ))}
              </div>

              {/* legend */}
              <div className="flex flex-wrap gap-4 rounded-2xl bg-white p-3 text-xs text-slate-600 shadow-sm">
                <Legend color="bg-white ring-1 ring-slate-300" label="Available" />
                <Legend color="bg-violet-200 ring-1 ring-violet-300" label="Premium" />
                <Legend color="bg-brand" label="Selected" />
                <Legend color="bg-slate-300" label="Booked" />
              </div>

              {/* seat map */}
              <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm">
                <div className="mx-auto w-fit">
                  <div className="mb-2 rounded-t-[3rem] border-b-2 border-slate-200 pb-2 text-center text-xs font-semibold text-slate-400">FRONT · Cockpit</div>
                  <div className="ml-8 mb-1 flex gap-2 text-[10px] text-slate-400">
                    {COLS.map((c, i) => <span key={c} className={cn("w-8 text-center", i === 3 && "ml-6")}>{c}</span>)}
                  </div>
                  {Array.from({ length: ROWS }).map((_, r) => {
                    const row = r + 1;
                    return (
                      <div key={row} className="mb-1 flex items-center gap-2">
                        <span className="w-6 text-right text-[10px] text-slate-400">{row}</span>
                        {COLS.map((c, i) => {
                          const id = `${row}${c}`;
                          const price = seatPrice(row, c);
                          let state: SeatState = price >= 450 ? "premium" : "available";
                          if (booked.has(id)) state = "booked";
                          if (seats[active] === id) state = "selected";
                          else if (chosen.has(id)) state = "booked";
                          return (
                            <button key={id} onClick={() => pick(id, price)} disabled={state === "booked"}
                              title={state === "booked" ? "Unavailable" : `${id} · ${formatINR(price)}`}
                              className={cn(
                                "group relative grid h-8 w-8 place-items-center rounded-lg text-[9px] font-bold transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:hover:scale-100",
                                i === 3 && "ml-6",
                                state === "available" && "bg-white text-slate-500 ring-1 ring-slate-300 hover:ring-brand",
                                state === "premium" && "bg-violet-200 text-violet-700 ring-1 ring-violet-300",
                                state === "selected" && "bg-brand text-white ring-2 ring-brand",
                                state === "booked" && "bg-slate-300 text-slate-400"
                              )}>
                              <Armchair size={14} />
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <PriceSummary cta={
                <div className="space-y-2">
                  <Button className="w-full" onClick={proceed}>Continue to Meals <ChevronRight size={16} /></Button>
                  <button onClick={proceed} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-brand">Skip seat selection</button>
                </div>
              } />
              {fare && <p className="px-1 text-[11px] text-slate-400">{fare.id === "COMFORT" || fare.id === "YOUR_CHOICE" ? "Your fare includes a free standard seat." : "Tip: Emergency row seats may be restricted to adults only."}</p>}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-4 w-4 rounded", color)} /> {label}</span>;
}
