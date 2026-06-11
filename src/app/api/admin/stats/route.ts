import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const { ok } = await isAdmin();
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [bookings, revenueAgg, users, enquiries, openEnquiries, tickets, openTickets, packages, byType, recent] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: "CONFIRMED" } }),
      prisma.user.count(),
      prisma.packageEnquiry.count(),
      prisma.packageEnquiry.count({ where: { status: "NEW" } }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.package.count(),
      prisma.booking.groupBy({ by: ["bookingType"], _count: { _all: true } }),
      prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { id: true, bookingRef: true, bookingType: true, origin: true, destination: true, totalAmount: true, status: true, contactEmail: true, createdAt: true, flightData: true } }),
    ]);

    const typeCounts: Record<string, number> = {};
    byType.forEach((t) => { typeCounts[t.bookingType] = t._count._all; });

    return NextResponse.json({
      stats: {
        bookings,
        revenue: revenueAgg._sum.totalAmount || 0,
        users,
        enquiries, openEnquiries,
        tickets, openTickets,
        packages,
        flightBookings: typeCounts.FLIGHT || 0,
        hotelBookings: typeCounts.HOTEL || 0,
        busBookings: typeCounts.BUS || 0,
      },
      recent,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
