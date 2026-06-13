import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Public — the header reads these toggles to decide which links to show.
export async function GET() {
  const cfg = await prisma.siteConfig.findUnique({ where: { id: "default" } });
  return NextResponse.json({
    showListProperty: cfg?.showListProperty ?? false,
    showTlBiz: cfg?.showTlBiz ?? false,
  });
}

// Super Admin only.
export async function PUT(req: NextRequest) {
  const { ok, permissions } = await isAdmin();
  if (!ok || !permissions.includes("settings.manage")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const data = { showListProperty: !!b.showListProperty, showTlBiz: !!b.showTlBiz };
  await prisma.siteConfig.upsert({ where: { id: "default" }, update: data, create: { id: "default", ...data } });
  return NextResponse.json({ ok: true, ...data });
}
