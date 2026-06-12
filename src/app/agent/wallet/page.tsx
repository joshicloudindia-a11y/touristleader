"use client";
import { AdminShell } from "@/components/admin/AdminShell";
import { WalletView } from "@/components/wallet/WalletView";

export default function AgentWalletPage() {
  return (
    <AdminShell title="My Wallet">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm text-slate-500">Commission you earn on bookings is credited here. The admin settles your balance monthly.</p>
        <WalletView pendingLabel="Awaiting settlement" />
      </div>
    </AdminShell>
  );
}
