import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, BadgePercent, Headphones, Sparkles, Star } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StickyNav } from "@/components/home/StickyNav";
import { Footer } from "@/components/Footer";
import { HotelSearchWidget } from "@/components/hotels/HotelSearchWidget";

const FEATURES = [
  { icon: BadgePercent, title: "Lowest Price Promise", text: "Member deals & instant discounts on 50,000+ stays." },
  { icon: ShieldCheck, title: "Free Cancellation", text: "Flexible bookings on most hotels, refunded fast." },
  { icon: Headphones, title: "24×7 Support", text: "Comfort before, during, and after your stay." },
  { icon: Sparkles, title: "Handpicked Hotels", text: "Verified reviews and quality-checked properties." },
];

const CITIES = [
  { city: "Goa", img: "/destinations/goa.jpg", price: "₹1,499" },
  { city: "Mumbai", img: "/destinations/mumbai.jpg", price: "₹2,199" },
  { city: "Jaipur", img: "/destinations/jaipur.jpg", price: "₹1,799" },
  { city: "Bengaluru", img: "/destinations/bengaluru.jpg", price: "₹1,999" },
  { city: "Dubai", img: "/destinations/dubai.jpg", price: "₹6,499" },
  { city: "Singapore", img: "/destinations/singapore.jpg", price: "₹8,999" },
];

export default function HotelsPage() {
  return (
    <>
      <StickyNav active="hotels" />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden pb-40 pt-28 sm:pb-44 sm:pt-32">
          <Image src="/hotels/hero.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/30" />
          <HomeHeader />
          <div className="relative mx-auto max-w-7xl px-4 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">Find your perfect stay</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/95 drop-shadow sm:text-lg">Handpicked hotels & resorts — comfort before, during, and after take off.</p>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-36 max-w-6xl px-4">
          <HotelSearchWidget />
        </div>

        {/* Features */}
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

        {/* Top cities */}
        <section className="mx-auto mt-14 max-w-7xl px-4">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Top destinations for hotels</h2>
          <p className="mt-1 text-sm text-slate-500">Book stays in India&apos;s favourite getaways and beyond.</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {CITIES.map((c) => (
              <Link key={c.city} href={`/hotels/search?city=${encodeURIComponent(c.city)}`} className="group overflow-hidden rounded-2xl shadow-sm">
                <div className="relative h-28 overflow-hidden">
                  <Image src={c.img} alt={c.city} fill sizes="(max-width:640px) 50vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/15 to-transparent" />
                  <span className="absolute bottom-2 left-3 text-lg font-extrabold text-white drop-shadow-lg">{c.city}</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2.5">
                  <span className="flex items-center gap-1 text-xs text-amber-500"><Star size={12} className="fill-amber-400" /> 4.5</span>
                  <span className="text-sm font-bold text-slate-900">{c.price}<span className="text-[10px] font-normal text-slate-400">/night</span></span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
