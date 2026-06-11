import { NextRequest, NextResponse } from "next/server";
import { searchBuses } from "@/lib/bdsd";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = {
    from: sp.get("from") || "Delhi",
    to: sp.get("to") || "Kanpur",
    date: sp.get("date") || new Date().toISOString().slice(0, 10),
  };
  const { buses, live } = await searchBuses(q);
  return NextResponse.json({ query: q, buses, live });
}
