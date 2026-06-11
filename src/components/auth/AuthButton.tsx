"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { User, ChevronDown, Ticket, LogOut, UserCircle, Heart, LifeBuoy } from "lucide-react";
import { useAuth } from "@/store/auth";
import { AuthModal } from "./AuthModal";
import { cn } from "@/lib/utils";

type Variant = "outline" | "pill";

export function AuthButton({ variant = "outline", compact = false }: { variant?: Variant; compact?: boolean }) {
  const router = useRouter();
  const { user, fetched, fetchMe, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fetched) fetchMe();
  }, [fetched, fetchMe]);

  // close on outside click (button + portaled menu), and on scroll/resize
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    const close = () => setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  const openMenu = () => {
    if (menuOpen) { setMenuOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setCoords({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    setMenuOpen(true);
  };

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  if (!user) {
    const cls = variant === "pill"
      ? "bg-white text-slate-800 shadow hover:bg-slate-50"
      : "border border-slate-300 text-slate-700 hover:border-brand hover:text-brand bg-white";
    return (
      <>
        <button onClick={() => setAuthOpen(true)} className={cn("flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-bold", cls)}>
          <User size={16} /> <span className={compact ? "hidden sm:inline" : ""}>Login / Signup</span>
          <ChevronDown size={13} />
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button ref={btnRef} onClick={openMenu}
        className={cn("flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm font-bold",
          variant === "pill" ? "bg-white text-slate-800 shadow" : "border border-slate-300 text-slate-700 hover:border-brand")}>
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand to-sky-400 text-xs text-white">{initial}</span>
        <span className="hidden max-w-[90px] truncate sm:inline">Hi, {firstName}</span>
        <ChevronDown size={13} className={cn("transition-transform", menuOpen && "rotate-180")} />
      </button>

      {menuOpen && coords && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} style={{ top: coords.top, right: coords.right }}
          className="fixed z-[200] w-60 max-w-[calc(100vw-16px)] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-fade-up">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-sm font-bold text-slate-900">{user.name || firstName}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
          <MenuItem icon={UserCircle} label="My Account" onClick={() => { setMenuOpen(false); router.push("/account"); }} />
          <MenuItem icon={Ticket} label="My Trips" onClick={() => { setMenuOpen(false); router.push("/account/trips"); }} />
          <MenuItem icon={Heart} label="Wishlist" onClick={() => { setMenuOpen(false); router.push("/account/wishlist"); }} />
          <MenuItem icon={LifeBuoy} label="My Tickets" onClick={() => { setMenuOpen(false); router.push("/account/tickets"); }} />
          <div className="my-1 border-t border-slate-100" />
          <MenuItem icon={LogOut} label="Logout" danger onClick={async () => { setMenuOpen(false); await logout(); router.refresh(); }} />
        </div>,
        document.body
      )}
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium", danger ? "text-rose-600 hover:bg-rose-50" : "text-slate-700 hover:bg-slate-50")}>
      <Icon size={16} className={danger ? "text-rose-500" : "text-slate-400"} /> {label}
    </button>
  );
}
