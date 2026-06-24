"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Salad, Drumstick, Nut, Apple, Soup, Check } from "lucide-react";
import { Header } from "@/components/Header";
import { Stepper } from "@/components/Stepper";
import { Button } from "@/components/ui/Button";
import { InfoPopup } from "@/components/ui/InfoPopup";
import { PriceSummary } from "@/components/booking/PriceSummary";
import { useBooking } from "@/store/booking";
import { MEALS } from "@/lib/constants";
import { cn, formatINR } from "@/lib/utils";

const ICONS: Record<string, React.ElementType> = { veg: Salad, nonveg: Drumstick, dryfruits: Nut, fruits: Apple, special: Soup };

function seatPrice(id: string) {
  const r = parseInt(id);
  const c = id.replace(/\d/g, "");
  if (r <= 3) return 600;
  if (c === "A" || c === "F") return 350;
  if (r >= 11 && r <= 13) return 450;
  return 200;
}

export default function MealsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pax, setPax] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [meals, setMeals] = useState<Record<number, string>>({});
  const { setMeal } = useBooking();

  useEffect(() => {
    setMounted(true);
    const st = useBooking.getState();
    if (!st.flight || !st.query) { router.replace("/"); return; }
    setPax(st.passengers.length ? st.passengers.map((p) => p.fullName || "Passenger") : ["Passenger"]);
    setMeals(st.meals);
  }, [router]);

  if (!mounted) return null;

  const recalc = (m: Record<number, string>) => {
    const mealTotal = Object.values(m).reduce((acc, mid) => acc + (MEALS.find((x) => x.id === mid)?.price || 0), 0);
    const seatTotal = Object.values(useBooking.getState().seats).reduce((acc, id) => acc + seatPrice(id), 0);
    useBooking.setState({ addOns: seatTotal + mealTotal });
  };

  const pick = (mealId: string) => {
    const next = { ...meals, [active]: meals[active] === mealId ? "" : mealId };
    setMeals(next);
    setMeal(active, next[active], MEALS.find((m) => m.id === next[active])?.price || 0);
    recalc(next);
  };

  return (
    <>
      <Header active="flights" />
      <main className="flex-1 bg-background">
        <div className="border-b border-slate-200 bg-white py-4"><Stepper current={3} /></div>
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
                {pax.map((name, i) => (
                  <button key={i} onClick={() => setActive(i)}
                    className={cn("rounded-xl border px-3 py-2 text-left text-sm", active === i ? "border-brand bg-brand/10" : "border-slate-200")}>
                    <span className="block text-xs text-slate-400">{name}</span>
                    <span className="font-semibold text-slate-800">{MEALS.find((m) => m.id === meals[i])?.label || "No meal"}</span>
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {MEALS.map((m) => {
                  const Icon = ICONS[m.id];
                  const selected = meals[active] === m.id;
                  return (
                    <div key={m.id} className={cn("flex items-center gap-3 rounded-2xl border-2 bg-white p-4 shadow-sm transition-colors", selected ? "border-brand" : "border-transparent ring-1 ring-slate-100")}>
                      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", selected ? "bg-brand text-white" : "bg-slate-100 text-slate-500")}>
                        <Icon size={22} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="flex items-center gap-1.5 font-semibold text-slate-800">{m.label}<InfoPopup title={m.label}><p className="text-sm text-slate-700">{m.info}</p></InfoPopup></p>
                        <p className="text-sm font-bold text-brand">{formatINR(m.price)}</p>
                      </div>
                      <Button size="sm" variant={selected ? "primary" : "outline"} onClick={() => pick(m.id)}>
                        {selected ? <><Check size={14} /> Added</> : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:sticky lg:top-20 lg:self-start">
              <PriceSummary cta={
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => router.push("/flights/payment")}>Continue to Payment <ChevronRight size={16} /></Button>
                  <button onClick={() => router.push("/flights/payment")} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-brand">Skip meal selection</button>
                </div>
              } />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
