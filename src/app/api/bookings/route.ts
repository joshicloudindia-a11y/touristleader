import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { genBookingRef, genPNR } from "@/lib/utils";
import { sendBookingEmail, bookingEmailHtml, hotelBookingEmailHtml, busBookingEmailHtml } from "@/lib/mailer";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { getSessionUser, isAdmin } from "@/lib/auth";
import { getBillingConfig, walletTxn } from "@/lib/billing";
import { computeCommission } from "@/lib/billing-core";

export const dynamic = "force-dynamic";

/** If the booker is an agent, credit their commission (+GST) to their wallet as PENDING. */
async function attributeAgentCommission(bookingRef: string, bookingTotal: number) {
  try {
    const { tier, user } = await isAdmin();
    if (tier !== "agent" || !user) return;
    const cfg = await getBillingConfig();
    const dbu = await prisma.user.findUnique({ where: { id: user.id }, select: { state: true } });
    const { commission, gst, credit } = computeCommission(bookingTotal, dbu?.state, cfg);
    if (credit <= 0) return;
    await prisma.booking.updateMany({ where: { bookingRef }, data: { bookedByAgentId: user.id, commission, commissionGst: gst.total } });
    await walletTxn({ userId: user.id, type: "CREDIT", amount: credit, reason: "COMMISSION", status: "PENDING", refType: "BOOKING", refId: bookingRef, note: `Commission · ${bookingRef}` });
  } catch (e) {
    console.warn("[bookings] commission attribution failed:", (e as Error).message);
  }
}

/** Service charge + GST breakdown sent from the payment page (added on top of existing fees). */
function billingFields(body: Record<string, unknown>) {
  const g = (body.gst || {}) as { type?: string; igst?: number; cgst?: number; sgst?: number };
  return {
    customerState: (body.customerState as string) || null,
    serviceCharge: Number(body.serviceCharge) || 0,
    gstType: g.type && g.type !== "NONE" ? g.type : null,
    igst: Number(g.igst) || 0,
    cgst: Number(g.cgst) || 0,
    sgst: Number(g.sgst) || 0,
  };
}

/** List the signed-in user's bookings (for My Trips). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ bookings: [] }, { status: 200 });
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ bookings: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    // Payment must verify before any booking is confirmed.
    const verifyPayment = () => {
      if (!razorpayPaymentId && !razorpayOrderId) return true; // test/no-payment path
      return !!(razorpayOrderId && razorpayPaymentId && razorpaySignature &&
        verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature));
    };

    // ---- Pay from wallet: debit upfront (covers all booking types) ----
    if (body.paymentSource === "wallet") {
      const su = await getSessionUser();
      if (!su) return NextResponse.json({ error: "Please log in" }, { status: 401 });
      const debit = await walletTxn({ userId: su.id, type: "DEBIT", amount: Math.round(Number(body.total) || 0), reason: "BOOKING", refType: "BOOKING", note: "Booking payment from wallet" });
      if (!debit) return NextResponse.json({ error: "Insufficient wallet balance. Please add money or choose another payment method." }, { status: 400 });
    }

    // ---- Hotel booking ----
    if (body.type === "HOTEL") {
      return await createHotelBooking(body, verifyPayment());
    }
    // ---- Bus booking ----
    if (body.type === "BUS") {
      return await createBusBooking(body, verifyPayment());
    }

    const { flight, fare, query, passengers, seats, meals, contactEmail, contactPhone, total } = body;
    if (!flight || !fare || !query || !contactEmail) {
      return NextResponse.json({ error: "Missing booking details" }, { status: 400 });
    }
    if (!verifyPayment()) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const bookingRef = genBookingRef();
    const pnr = genPNR();
    const lead = passengers?.[0]?.fullName || "Traveller";
    const sessionUser = await getSessionUser();

    let saved = true;
    try {
      await prisma.booking.create({
        data: {
          userId: sessionUser?.id || null,
          bookingRef,
          pnr,
          status: "CONFIRMED",
          tripType: query.tripType,
          passengerType: query.passengerType,
          fareType: fare.id,
          origin: flight.from,
          destination: flight.to,
          departDate: new Date(flight.departTime),
          returnDate: query.returnDate ? new Date(query.returnDate) : null,
          cabinClass: query.cabinClass,
          adults: query.travellers.adults,
          children: query.travellers.children,
          infants: query.travellers.infants,
          baseFare: Math.round(fare.price * 0.82),
          taxes: Math.round(fare.price * 0.18),
          addOns: body.addOns || 0,
          ...billingFields(body),
          totalAmount: total || fare.price,
          paymentSource: body.paymentSource || (razorpayPaymentId ? "razorpay" : "test"),
          paymentId: razorpayPaymentId || null,
          paymentOrderId: razorpayOrderId || null,
          paymentMethod: razorpayPaymentId ? "razorpay" : body.paymentSource === "wallet" ? "wallet" : "test",
          paymentStatus: (razorpayPaymentId || body.paymentSource === "wallet") ? "PAID" : "TEST",
          contactEmail,
          contactPhone: contactPhone || "",
          flightData: flight,
          passengers: passengers || [],
          seats: seats || {},
          meals: meals || {},
        },
      });
    } catch (dbErr) {
      console.error("[bookings] DB save failed:", (dbErr as Error).message);
      saved = false;
    }

    // fire-and-forget email (full details)
    const pax = Math.max(1, query.travellers.adults + query.travellers.children);
    const travellers = query.travellers.adults + query.travellers.children + query.travellers.infants;
    const base = Math.round(fare.price * 0.82) * pax;
    const taxes = fare.price * pax - base;
    const addOnsAmt = body.addOns || 0;
    const grand = total || fare.price * pax;
    const convenience = Math.max(0, grand - fare.price * pax - addOnsAmt);
    const tm = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
    const dur = flight.durationMinutes ? `${Math.floor(flight.durationMinutes / 60)}h ${String(flight.durationMinutes % 60).padStart(2, "0")}m` : "";

    sendBookingEmail({
      to: contactEmail,
      bookingRef,
      pnr,
      html: bookingEmailHtml({
        bookingRef, pnr,
        origin: flight.from, destination: flight.to,
        dateLabel: new Date(flight.departTime).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }),
        departTime: tm(flight.departTime), arriveTime: tm(flight.arriveTime),
        airline: flight.airlineName, flightNumber: flight.flightNumber,
        stops: flight.stops || 0, durationLabel: dur,
        passengerName: lead, travellers, cabin: query.cabinClass, fareLabel: fare.label,
        cabinBaggage: flight.cabinBaggage || "7 kg", checkInBaggage: flight.checkInBaggage || "15 kg",
        base, taxes, addOns: addOnsAmt, convenience, total: grand,
      }),
    }).catch(() => {});

    await attributeAgentCommission(bookingRef, grand);
    return NextResponse.json({ bookingRef, pnr, saved });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

interface HotelBookingBody {
  hotel?: { name: string; area: string; city: string; image: string; starRating: number };
  roomName?: string;
  roomPrice?: number;
  nights?: number;
  query?: { city: string; checkIn: string; checkOut: string; rooms: number; adults: number; children: number };
  guest?: { fullName: string; email: string; phone?: string; requests?: string };
  total?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentSource?: string;
}

async function createHotelBooking(body: HotelBookingBody, paymentOk: boolean) {
  const { hotel, roomName, roomPrice = 0, nights = 1, query, guest, total, razorpayOrderId, razorpayPaymentId } = body;
  if (!hotel || !query || !guest?.email) {
    return NextResponse.json({ error: "Missing hotel booking details" }, { status: 400 });
  }
  if (!paymentOk) {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  const bookingRef = genBookingRef();
  const confirmationNo = genPNR();
  const sessionUser = await getSessionUser();
  const room = roomPrice * nights;
  const taxes = Math.round(room * 0.12);
  const grand = total || room + taxes;

  let saved = true;
  try {
    await prisma.booking.create({
      data: {
        userId: sessionUser?.id || null,
        bookingRef,
        pnr: confirmationNo,
        bookingType: "HOTEL",
        status: "CONFIRMED",
        tripType: "ONE_WAY",
        origin: query.city,
        destination: query.city,
        departDate: new Date(query.checkIn),
        returnDate: query.checkOut ? new Date(query.checkOut) : null,
        cabinClass: roomName || "Standard Room",
        adults: query.adults || 1,
        children: query.children || 0,
        baseFare: roomPrice,
        taxes,
        addOns: 0,
        ...billingFields(body as unknown as Record<string, unknown>),
        totalAmount: grand,
        paymentSource: body.paymentSource || (razorpayPaymentId ? "razorpay" : "test"),
        paymentId: razorpayPaymentId || null,
        paymentOrderId: razorpayOrderId || null,
        paymentMethod: razorpayPaymentId ? "razorpay" : body.paymentSource === "wallet" ? "wallet" : "test",
        paymentStatus: (razorpayPaymentId || body.paymentSource === "wallet") ? "PAID" : "TEST",
        contactEmail: guest.email,
        contactPhone: guest.phone || "",
        flightData: { ...hotel, roomName, nights, checkIn: query.checkIn, checkOut: query.checkOut, rooms: query.rooms },
        passengers: [{ fullName: guest.fullName, requests: guest.requests || "" }],
      },
    });
  } catch (e) {
    console.error("[bookings] hotel DB save failed:", (e as Error).message);
    saved = false;
  }

  const html = hotelBookingEmailHtml({
    bookingRef, confirmationNo,
    hotelName: hotel.name, area: hotel.area, city: hotel.city, starRating: hotel.starRating,
    roomName: roomName || "Room", nights, checkIn: query.checkIn, checkOut: query.checkOut,
    guestName: guest.fullName, guests: (query.adults || 1) + (query.children || 0), rooms: query.rooms || 1,
    roomTotal: room, taxes, convenience: Math.max(0, grand - room - taxes), total: grand,
  });
  sendBookingEmail({ to: guest.email, bookingRef, pnr: confirmationNo, html, subject: `Stay Booked · ${hotel.name}, ${hotel.city} · ${bookingRef}` }).catch(() => {});

  await attributeAgentCommission(bookingRef, grand);
  return NextResponse.json({ bookingRef, pnr: confirmationNo, saved });
}

interface BusBookingBody {
  bus?: { operator: string; busType: string; from: string; to: string; departTime: string; arriveTime: string };
  query?: { from: string; to: string; date: string };
  seats?: { id: string; price: number }[];
  boarding?: { name: string; time: string };
  dropping?: { name: string; time: string };
  passengers?: { fullName: string; age: string; gender: string; seatId: string }[];
  contactEmail?: string;
  contactPhone?: string;
  total?: number;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentSource?: string;
}

async function createBusBooking(body: BusBookingBody, paymentOk: boolean) {
  const { bus, query, seats = [], boarding, dropping, passengers = [], contactEmail, contactPhone, total, razorpayOrderId, razorpayPaymentId } = body;
  if (!bus || !query || !contactEmail || seats.length === 0) {
    return NextResponse.json({ error: "Missing bus booking details" }, { status: 400 });
  }
  if (!paymentOk) return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });

  const bookingRef = genBookingRef();
  const ticketNo = genPNR();
  const sessionUser = await getSessionUser();
  const fareTotal = seats.reduce((a, s) => a + s.price, 0);
  const taxes = Math.round(fareTotal * 0.05);
  const grand = total || fareTotal + taxes + 49;
  const lead = passengers[0]?.fullName || "Traveller";

  let saved = true;
  try {
    await prisma.booking.create({
      data: {
        userId: sessionUser?.id || null,
        bookingRef, pnr: ticketNo, bookingType: "BUS", status: "CONFIRMED", tripType: "ONE_WAY",
        origin: query.from, destination: query.to, departDate: new Date(bus.departTime),
        cabinClass: bus.busType, adults: passengers.length || seats.length,
        baseFare: fareTotal, taxes, addOns: 0, ...billingFields(body as unknown as Record<string, unknown>), totalAmount: grand,
        paymentSource: body.paymentSource || (razorpayPaymentId ? "razorpay" : "test"),
        paymentId: razorpayPaymentId || null, paymentOrderId: razorpayOrderId || null,
        paymentMethod: razorpayPaymentId ? "razorpay" : body.paymentSource === "wallet" ? "wallet" : "test", paymentStatus: (razorpayPaymentId || body.paymentSource === "wallet") ? "PAID" : "TEST",
        contactEmail, contactPhone: contactPhone || "",
        flightData: { ...bus, boarding, dropping, seatIds: seats.map((s) => s.id), date: query.date },
        passengers,
      },
    });
  } catch (e) {
    console.error("[bookings] bus DB save failed:", (e as Error).message);
    saved = false;
  }

  const html = busBookingEmailHtml({
    bookingRef, ticketNo, operator: bus.operator, busType: bus.busType,
    from: query.from, to: query.to, departTime: bus.departTime, arriveTime: bus.arriveTime,
    boarding: boarding?.name || "-", boardingTime: boarding?.time || "", dropping: dropping?.name || "-",
    seatIds: seats.map((s) => s.id), passengerName: lead, passengers: passengers.length || seats.length,
    fareTotal, taxes, convenience: Math.max(0, grand - fareTotal - taxes), total: grand,
  });
  sendBookingEmail({ to: contactEmail, bookingRef, pnr: ticketNo, html, subject: `Bus Ticket Confirmed · ${query.from} → ${query.to} · ${bookingRef}` }).catch(() => {});

  await attributeAgentCommission(bookingRef, grand);
  return NextResponse.json({ bookingRef, pnr: ticketNo, saved });
}
