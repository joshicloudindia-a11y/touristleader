import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpToken, setSessionCookie, isStaffUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, otpToken, name, phone, context } = await req.json();
    const e = (email || "").trim().toLowerCase();
    if (!e || !otp || !otpToken) {
      return NextResponse.json({ error: "Missing details" }, { status: 400 });
    }
    if (!verifyOtpToken(otpToken, e, String(otp).trim())) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 401 });
    }

    // Find or create the user (passwordless).
    let user = await prisma.user.findUnique({ where: { email: e }, select: { id: true, email: true, name: true, phone: true, role: true } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: e, name: name?.trim() || null, phone: phone?.trim() || null },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
    } else if ((name?.trim() && !user.name) || (phone?.trim() && !user.phone)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: user.name || name?.trim() || null, phone: user.phone || phone?.trim() || null },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
    }

    // Enforce login context: staff must use /admin, customers must use the home login.
    const staff = await isStaffUser(user.email, user.role);
    if (context === "customer" && staff) {
      return NextResponse.json({ error: "This is a staff account. Please sign in from the admin panel at /admin." }, { status: 403 });
    }
    if (context === "admin" && !staff) {
      return NextResponse.json({ error: "This account doesn't have admin access. Please use the customer login on the home page." }, { status: 403 });
    }

    const { role: _role, ...safeUser } = user;
    await setSessionCookie(user.id);
    return NextResponse.json({ user: safeUser, staff });
  } catch (err) {
    console.error("[auth/otp/verify]", (err as Error).message);
    return NextResponse.json({ error: "Could not verify code" }, { status: 500 });
  }
}
