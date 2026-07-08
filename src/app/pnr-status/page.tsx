import type { Metadata } from "next";
import { StickyNav } from "@/components/home/StickyNav";
import { Footer } from "@/components/Footer";
import { PnrStatus } from "@/components/home/PnrStatus";

export const metadata: Metadata = {
  title: "Check PNR / Booking Status · Tourist Leader",
  description: "Track your flight, hotel or bus booking status with your PNR or booking reference — no login required.",
};

export default function PnrStatusPage() {
  return (
    <>
      <StickyNav active="flights" />
      <main className="flex-1 bg-slate-50/60">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Check your booking status</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Enter your PNR or booking reference along with the email or last name used at booking to see your trip status instantly.
            </p>
          </div>
          <PnrStatus />
        </section>
      </main>
      <Footer />
    </>
  );
}
