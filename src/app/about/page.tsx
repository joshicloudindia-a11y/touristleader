import type { Metadata } from "next";
import { Leaf, Briefcase, Newspaper, Mail, Phone, MapPin, Gift, Smartphone, BookOpen, Building2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us · Tourist Leader",
  description: "About Tourist Leader — our story, careers, press, sustainability, contact, gift cards, app and blog.",
};

function Section({ id, icon: Icon, title, children }: { id: string; icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-slate-100 py-8 first:border-t-0">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand"><Icon size={24} /></span>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{title}</h2>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-100">
        <section className="bg-gradient-to-br from-brand-dark to-brand py-14 text-center text-white">
          <Building2 size={44} className="mx-auto" />
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">About Tourist Leader</h1>
          <p className="mx-auto mt-2 max-w-xl px-4 text-white/90">{BRAND.tagline}.</p>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-8">
            <Section id="story" icon={Building2} title="Our story">
              <p>Tourist Leader is a full-stack travel platform for flights, hotels, holiday packages, bus, visa, forex and insurance. We started with one belief — that travel should feel caring, seamless and sustainable, with comfort before, during and after take off.</p>
              <p>Today we help travellers across India plan and book complete trips in one place, backed by 24×7 human support and transparent pricing.</p>
            </Section>

            <Section id="careers" icon={Briefcase} title="Careers">
              <p>We&apos;re a small, fast-moving team building delightful travel experiences. We hire for curiosity, ownership and craft across engineering, design, operations and customer support.</p>
              <p>Interested? Write to <a href="mailto:careers@touristleader.com" className="font-semibold text-brand hover:underline">careers@touristleader.com</a> with your role of interest and portfolio/CV.</p>
            </Section>

            <Section id="press" icon={Newspaper} title="Press &amp; media">
              <p>For press enquiries, brand assets or interview requests, reach our communications team at <a href="mailto:press@touristleader.com" className="font-semibold text-brand hover:underline">press@touristleader.com</a>. We typically respond within two business days.</p>
            </Section>

            <Section id="sustainability" icon={Leaf} title="Sustainability">
              <p>Sustainable travel is core to who we are. We surface carbon-aware itineraries, promote efficient routings, and partner with operators who share our commitment to responsible tourism.</p>
              <p>We&apos;re continually working to reduce the footprint of every journey booked with us.</p>
            </Section>

            <Section id="contact" icon={Mail} title="Contact us">
              <p className="flex items-center gap-2"><Mail size={15} className="text-brand" /> <a href="mailto:help@touristleader.com" className="font-semibold text-brand hover:underline">help@touristleader.com</a></p>
              <p className="flex items-center gap-2"><Phone size={15} className="text-brand" /> +91 1800-123-4567 (24×7)</p>
              <p className="flex items-center gap-2"><MapPin size={15} className="text-brand" /> Tourist Leader, Bengaluru, Karnataka, India</p>
              <p>For booking-specific help, please <a href="/help" className="font-semibold text-brand hover:underline">raise a support ticket</a>.</p>
            </Section>

            <Section id="gift-cards" icon={Gift} title="Gift cards">
              <p>Give the gift of travel. Tourist Leader gift cards can be redeemed towards flights, hotels, holidays and more. Gift cards are launching soon — tell us you&apos;re interested at <a href="mailto:help@touristleader.com?subject=Gift%20Cards" className="font-semibold text-brand hover:underline">help@touristleader.com</a> and we&apos;ll notify you first.</p>
            </Section>

            <Section id="mobile-app" icon={Smartphone} title="Mobile app">
              <p>The Tourist Leader app for Android and iOS is on the way — manage trips, get live updates and book on the go. Meanwhile, our website works great on mobile, including a quick bottom navigation. Want early access? Email <a href="mailto:help@touristleader.com?subject=App%20Early%20Access" className="font-semibold text-brand hover:underline">help@touristleader.com</a>.</p>
            </Section>

            <Section id="blog" icon={BookOpen} title="Blog">
              <p>Travel guides, destination tips and money-saving tricks — our blog is coming soon. Subscribe for launch updates at <a href="mailto:help@touristleader.com?subject=Blog" className="font-semibold text-brand hover:underline">help@touristleader.com</a>.</p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
