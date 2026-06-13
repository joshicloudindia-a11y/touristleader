import Image from "next/image";
import { Percent, Truck, ShieldCheck, Globe2 } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StickyNav } from "@/components/home/StickyNav";
import { Footer } from "@/components/Footer";
import { ForexWidget } from "@/components/forex/ForexWidget";

const FEATURES = [
  { icon: Percent, title: "Best exchange rates", text: "Live, transparent rates — no hidden margins." },
  { icon: Truck, title: "Doorstep delivery", text: "Forex card or currency notes, home-delivered." },
  { icon: Globe2, title: "Multi-currency card", text: "Load 15+ currencies on a single travel card." },
  { icon: ShieldCheck, title: "RBI-authorised", text: "Secure, compliant forex through trusted partners." },
];

export default function ForexPage() {
  return (
    <>
      <StickyNav active="forex" />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden pb-40 pt-28 sm:pb-44 sm:pt-32">
          <Image src="/packages/europe.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/75 via-slate-900/50 to-slate-900/30" />
          <HomeHeader />
          <div className="relative mx-auto max-w-7xl px-4 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">Forex, sorted before you fly</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/95 drop-shadow sm:text-lg">Order a multi-currency forex card or foreign currency notes at the best rates — delivered to your door.</p>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-36 max-w-7xl px-4"><ForexWidget /></div>

        <section className="mx-auto mt-16 max-w-7xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand"><f.icon size={22} /></span>
                <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
