import Image from "next/image";
import { ShieldCheck, BadgePercent, Headphones, Sparkles } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StickyNav } from "@/components/home/StickyNav";
import { Footer } from "@/components/Footer";
import { PackageSearchWidget } from "@/components/holidays/PackageSearchWidget";
import { PackageGrid } from "@/components/holidays/PackageGrid";

const FEATURES = [
  { icon: BadgePercent, title: "Best Price, Guaranteed", text: "Customised quotes & exclusive package deals." },
  { icon: ShieldCheck, title: "Handcrafted Itineraries", text: "Curated day-by-day plans with local guides." },
  { icon: Headphones, title: "24×7 On-Trip Support", text: "Comfort before, during, and after your trip." },
  { icon: Sparkles, title: "Transfers & Sightseeing", text: "All transfers, entries & assistance included." },
];

export default function HolidaysPage() {
  return (
    <>
      <StickyNav active="holidays" />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden pb-40 pt-28 sm:pb-44 sm:pt-32">
          <Image src="/packages/bali.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/30" />
          <HomeHeader />
          <div className="relative mx-auto max-w-7xl px-4 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">Holiday packages that care</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/95 drop-shadow sm:text-lg">Handcrafted trips with flights, stays, transfers & sightseeing — made seamless.</p>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-36 max-w-6xl px-4"><PackageSearchWidget /></div>

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

        <section className="mx-auto mt-14 max-w-7xl px-4">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Featured holiday packages</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">Top-rated trips loved by our travellers.</p>
          <PackageGrid />
        </section>
      </main>
      <Footer />
    </>
  );
}
