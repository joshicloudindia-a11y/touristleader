"use client";
import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { OFFERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function OffersCarousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % OFFERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
          {OFFERS.map((o) => (
            <div key={o.id} className={cn("flex min-w-full items-center justify-between gap-4 bg-gradient-to-r p-5 text-white sm:p-6", o.bg)}>
              <div>
                <p className="text-xl font-extrabold sm:text-2xl">{o.title}</p>
                <p className="mt-0.5 text-sm text-white/90">{o.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold backdrop-blur">
                <Tag size={14} /> {o.code}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {OFFERS.map((_, idx) => (
          <button key={idx} onClick={() => setI(idx)} className={cn("h-1.5 rounded-full transition-all", i === idx ? "w-6 bg-brand" : "w-1.5 bg-slate-300")} />
        ))}
      </div>
    </div>
  );
}
