import Link from "next/link";
import Image from "next/image";
import { Globe, AtSign, MessageCircle, Rss } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { T } from "@/components/T";

const COLS = [
  { key: "foot_company", links: ["About Us", "Careers", "Press", "Sustainability", "Contact"] },
  { key: "foot_products", links: ["Flights", "Hotels", "Holiday Packages", "Bus", "Visa", "Forex"] },
  { key: "foot_support", links: ["Help Centre", "Cancellation", "Refund Policy", "Baggage Rules", "Travel Insurance"] },
  { key: "foot_discover", links: ["Cheap Flights", "Offers", "Gift Cards", "Mobile App", "Blog"] },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white">
                <Image src="/logo.avif" alt="Tourist Leader" width={40} height={40} className="h-9 w-9 rounded-full object-contain" />
              </span>
              <span className="text-lg font-extrabold text-white">
                Tourist <span className="text-sky-400">Leader</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-400">{BRAND.tagline}.</p>
            <p className="mt-1 text-sm font-medium text-slate-200">{BRAND.promise}</p>
            <div className="mt-4 flex gap-2">
              {[Globe, AtSign, MessageCircle, Rss].map((Icon, i) => (
                <a key={i} href="#" className="grid h-9 w-9 place-items-center rounded-full bg-slate-800 hover:bg-brand transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.key}>
              <h4 className="mb-3 text-sm font-semibold text-white"><T k={col.key} /></h4>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors">{l}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Tourist Leader.com — All rights reserved. Convenience fee is non-refundable.
        </div>
      </div>
    </footer>
  );
}
