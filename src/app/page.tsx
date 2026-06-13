import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Headphones, Leaf, BadgePercent, Plane } from "lucide-react";
import { HomeHeader } from "@/components/home/HomeHeader";
import { StickyNav } from "@/components/home/StickyNav";
import { Footer } from "@/components/Footer";
import { SearchWidget } from "@/components/home/SearchWidget";
import { OffersCarousel } from "@/components/home/OffersCarousel";
import { WishlistButton } from "@/components/WishlistButton";
import { BRAND } from "@/lib/constants";

const FEATURES = [
  { icon: Leaf, title: "Caring & Sustainable", text: "Carbon-aware itineraries and inclusive fares for every traveller." },
  { icon: ShieldCheck, title: "Seamless Booking", text: "From search to confirmation in a few comfortable taps." },
  { icon: Headphones, title: "24×7 Support", text: "Comfort before, during, and after take off — we're with you." },
  { icon: BadgePercent, title: "Best Fare Promise", text: "Fare calendar, bank offers and wallet cashback, always on." },
];

const DESTS = [
  { city: "Goa", code: "GOI", price: "₹2,499", img: "/destinations/goa.jpg" },
  { city: "Mumbai", code: "BOM", price: "₹1,899", img: "/destinations/mumbai.jpg" },
  { city: "Dubai", code: "DXB", price: "₹12,499", img: "/destinations/dubai.jpg" },
  { city: "Bengaluru", code: "BLR", price: "₹2,199", img: "/destinations/bengaluru.jpg" },
  { city: "Jaipur", code: "JAI", price: "₹2,799", img: "/destinations/jaipur.jpg" },
  { city: "Singapore", code: "SIN", price: "₹18,999", img: "/destinations/singapore.jpg" },
];

export default function HomePage() {
  return (
    <>
      <StickyNav active="flights" />
      <main className="flex-1">
        {/* Hero with photo background + transparent header (MakeMyTrip style) */}
        <section className="relative isolate overflow-hidden pb-40 pt-28 sm:pb-44 sm:pt-32">
          <Image src="/hero.jpg" alt="" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 via-slate-900/45 to-slate-900/25" />
          <HomeHeader />
          <div className="relative mx-auto max-w-7xl px-4 text-center text-white">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">Fly with comfort, every step of the way</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/95 drop-shadow sm:text-lg">{BRAND.tagline}.</p>
          </div>
        </section>

        {/* Search widget overlapping hero (z-20 so it paints above the positioned hero) */}
        <div className="relative z-20 mx-auto -mt-36 max-w-6xl px-4">
          <SearchWidget />
        </div>

        {/* Offers */}
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <OffersCarousel />
        </section>

        {/* Features */}
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popular destinations */}
        <section className="mx-auto mt-14 max-w-6xl px-4">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Popular destinations</h2>
          <p className="mt-1 text-sm text-slate-500">Handpicked fares to get you packing.</p>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {DESTS.map((d) => (
              <Link
                key={d.code}
                href={`/flights/search?tripType=ONE_WAY&from=${d.code === "DEL" ? "BOM" : "DEL"}&to=${d.code}&cabinClass=Economy&adults=1&children=0&infants=0&passengerType=REGULAR`}
                className="group cursor-pointer overflow-hidden rounded-2xl shadow-sm"
              >
                <div className="relative h-28 overflow-hidden">
                  <Image src={d.img} alt={d.city} fill sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 16vw" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/15 to-transparent" />
                  <Plane size={56} className="absolute -bottom-3 -right-3 rotate-12 text-white/25" />
                  <WishlistButton className="absolute right-2 top-2" size={15} item={{ itemType: "DESTINATION", itemKey: d.code, title: d.city, subtitle: `Flights from ${d.price}`, image: d.img, price: d.price, href: `/flights/search?tripType=ONE_WAY&from=${d.code === "DEL" ? "BOM" : "DEL"}&to=${d.code}&cabinClass=Economy&adults=1&children=0&infants=0&passengerType=REGULAR` }} />
                  <span className="absolute bottom-2 left-3 text-lg font-extrabold text-white drop-shadow-lg">{d.city}</span>
                </div>
                <div className="flex items-center justify-between bg-white px-3 py-2.5">
                  <span className="text-xs text-slate-400">from</span>
                  <span className="text-sm font-bold text-slate-900">{d.price}</span>
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
