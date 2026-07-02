import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { GROUP_MIN_TRAVELLERS } from "@/lib/group";
import { sendGroupEnquiryEmails } from "@/lib/mailer";

export const dynamic = "force-dynamic";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function enquiryNo() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return `TLGRP${s}`;
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!(b.from || "").trim() || !(b.to || "").trim()) return NextResponse.json({ error: "Please choose the route" }, { status: 400 });
    if (!(b.departDate || "").trim()) return NextResponse.json({ error: "Please choose the departure date" }, { status: 400 });
    if (!(b.name || "").trim()) return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    if (!emailRe.test((b.email || "").trim())) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if ((b.phone || "").replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });

    const adults = Math.max(0, Number(b.adults) || 0);
    const children = Math.max(0, Number(b.children) || 0);
    const infants = Math.max(0, Number(b.infants) || 0);
    const total = adults + children + infants;
    if (total < GROUP_MIN_TRAVELLERS) {
      return NextResponse.json({ error: `Group bookings need at least ${GROUP_MIN_TRAVELLERS} travellers.` }, { status: 400 });
    }
    const tripType = b.tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
    if (tripType === "ROUND_TRIP" && !(b.returnDate || "").trim()) {
      return NextResponse.json({ error: "Please choose the return date for a round trip." }, { status: 400 });
    }

    const passengerNames = Array.isArray(b.passengerNames)
      ? b.passengerNames.map((n: unknown) => String(n || "").trim()).filter(Boolean)
      : [];

    const user = await getSessionUser();
    const no = enquiryNo();
    const data = {
      enquiryNo: no,
      userId: user?.id || null,
      tripType,
      origin: b.from.trim().toUpperCase(),
      destination: b.to.trim().toUpperCase(),
      departDate: b.departDate.trim(),
      returnDate: tripType === "ROUND_TRIP" ? (b.returnDate || "").trim() || null : null,
      cabinClass: (b.cabinClass || "Economy").trim(),
      adults,
      children,
      infants,
      passengerNames,
      name: b.name.trim(),
      email: b.email.trim().toLowerCase(),
      phone: b.phone.trim(),
      company: (b.company || "").trim() || null,
      message: (b.message || "").trim() || null,
      status: "NEW",
      source: "WEB",
    };

    let saved = true;
    try { await prisma.groupEnquiry.create({ data }); } catch (e) { console.error("[group] save failed:", (e as Error).message); saved = false; }

    sendGroupEnquiryEmails({
      enquiryNo: no, tripType, origin: data.origin, destination: data.destination,
      departDate: data.departDate, returnDate: data.returnDate || undefined, cabinClass: data.cabinClass,
      travellers: total, adults, children, infants, passengerNames,
      name: data.name, email: data.email, phone: data.phone, company: data.company || undefined, message: data.message || undefined,
    }).catch(() => {});

    return NextResponse.json({ enquiryNo: no, saved });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
