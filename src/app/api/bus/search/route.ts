import { NextRequest, NextResponse } from "next/server";
import { searchBuses } from "@/lib/bdsd";

export const dynamic = "force-dynamic";

/** BDSD echoes UserIp back and logs it, so forward the real caller's address. */
function clientIp(req: NextRequest): string | undefined {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || undefined;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = {
    from: sp.get("from") || "Delhi",
    to: sp.get("to") || "Kanpur",
    date: sp.get("date") || new Date().toISOString().slice(0, 10),
  };
  const { buses, live, searchTokenId, reason } = await searchBuses(q, clientIp(req));
  // searchTokenId is required by seatlayout/boardingpoint/blockseat/book.
  return NextResponse.json({ query: q, buses, live, searchTokenId, ...(reason ? { reason } : {}) });
}
