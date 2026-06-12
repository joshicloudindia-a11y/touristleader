"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Store, Briefcase, Luggage, Heart, Globe, Menu, X } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

const UTILITY = [
  { icon: Store, title: "List Your Property", sub: "Grow your business!", href: "/list-property" },
  { icon: Briefcase, title: "TL Biz", sub: "Business Travel", href: "/tl-biz" },
  { icon: Luggage, title: "My Trips", sub: "Manage bookings", href: "/account/trips" },
  { icon: Heart, title: "Wishlist", sub: "Saved favourites", href: "/account/wishlist" },
];

export function HomeHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow">
            <Image src="/logo.avif" alt="Tourist Leader" width={40} height={40} priority className="h-9 w-9 rounded-full object-contain" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white drop-shadow">
            Tourist <span className="text-sky-200">Leader</span>
          </span>
        </Link>

        {/* Utility nav (desktop) */}
        <nav className="hidden items-center gap-1 xl:flex">
          {UTILITY.map((u) => (
            <Link key={u.title} href={u.href} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-left text-white/95 hover:bg-white/10">
              <u.icon size={20} strokeWidth={1.6} />
              <span className="leading-tight">
                <span className="block text-xs font-bold">{u.title}</span>
                <span className="block text-[10px] text-white/70">{u.sub}</span>
              </span>
            </Link>
          ))}
        </nav>

        {/* Right: login + currency */}
        <div className="flex items-center gap-2">
          <AuthButton variant="pill" compact />
          <button className="hidden items-center gap-1.5 rounded-lg border border-white/40 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:flex">
            <Globe size={15} /> INR | EN
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-lg text-white hover:bg-white/10 xl:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile utility dropdown */}
      {open && (
        <div className="mx-4 rounded-2xl bg-white p-2 shadow-xl xl:hidden">
          {UTILITY.map((u) => (
            <Link key={u.title} href={u.href} onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50">
              <u.icon size={20} className="text-brand" strokeWidth={1.6} />
              <span><span className="block text-sm font-bold text-slate-800">{u.title}</span><span className="block text-xs text-slate-500">{u.sub}</span></span>
            </Link>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"><Globe size={20} className="text-brand" /> <span className="text-sm font-semibold text-slate-800">INR | English</span></button>
        </div>
      )}
    </header>
  );
}
