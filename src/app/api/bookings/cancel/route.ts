import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { walletTxn } from "@/lib/billing";
import { refundPayment } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Please log in" }, { status: 401 });
  const { bookingRef } = await req.json();
  if (!bookingRef) return NextResponse.json({ error: "Missing booking" }, { status: 400 });

  const booking = await prisma.booking.findFirst({ where: { bookingRef, userId: user.id } });
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status === "CANCELLED") return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

  const amount = Math.round(booking.totalAmount || 0);
  let refundMode: "wallet" | "razorpay" | "none" = "none";
  let refundAmount = 0;
  let message = "";

  if (booking.paymentSource === "wallet") {
    // money was paid from wallet → credit it straight back
    await walletTxn({ userId: user.id, type: "CREDIT", amount, reason: "REFUND", refType: "BOOKING", refId: bookingRef, note: `Refund · ${bookingRef} (cancelled)` });
    refundMode = "wallet"; refundAmount = amount;
    message = `₹${amount} refunded to your TouristLeader wallet.`;
  } else if (booking.paymentId) {
    // paid via card / UPI / netbanking → refund to the original bank account
    const r = await refundPayment(booking.paymentId, amount);
    if (r.ok) { refundMode = "razorpay"; refundAmount = amount; message = `₹${amount} is being refunded to your original payment method (3–5 working days).`; }
    else { message = "Booking cancelled. Refund to your bank could not be initiated automatically — our team will process it manually."; }
  } else {
    message = "Booking cancelled.";
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), refundAmount, refundMode: refundMode === "none" ? null : refundMode },
  });

  return NextResponse.json({ ok: true, refundMode, refundAmount, message });
}
