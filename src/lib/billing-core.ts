/**
 * Pure billing math — service charge + GST place-of-supply. Client-safe (no DB).
 * GST is applied ONLY to amounts we charge (service charge, agent commission),
 * never to the airline/API "Taxes & fees" or the existing convenience fee.
 */
export interface BillingConfigData {
  serviceChargeType: "FLAT" | "PERCENT";
  serviceChargeValue: number;
  companyState: string;
  igstRate: number;
  cgstRate: number;
  sgstRate: number;
  gstEnabled: boolean;
  agentCommissionPercent: number;
  commissionGstApplicable: boolean;
}

export const DEFAULT_BILLING: BillingConfigData = {
  serviceChargeType: "FLAT",
  serviceChargeValue: 0,
  companyState: "Karnataka",
  igstRate: 18,
  cgstRate: 9,
  sgstRate: 9,
  gstEnabled: true,
  agentCommissionPercent: 0,
  commissionGstApplicable: true,
};

export interface GstBreakdown { type: "IGST" | "CGST_SGST" | "NONE"; igst: number; cgst: number; sgst: number; total: number }

const r = (n: number) => Math.round(n);

/** Service charge for a given booking amount (rupees). */
export function computeServiceCharge(bookingAmount: number, cfg: BillingConfigData): number {
  if (!bookingAmount || bookingAmount <= 0) return 0;
  return cfg.serviceChargeType === "PERCENT" ? r((bookingAmount * cfg.serviceChargeValue) / 100) : r(cfg.serviceChargeValue);
}

/** GST on a taxable amount, split by place of supply (same state → CGST+SGST, else IGST).
 *  No GST is applied until a billing state is selected (service charge shows alone first). */
export function computeGst(taxable: number, customerState: string | undefined | null, cfg: BillingConfigData): GstBreakdown {
  if (!cfg.gstEnabled || !taxable || taxable <= 0) return { type: "NONE", igst: 0, cgst: 0, sgst: 0, total: 0 };
  if (!customerState || !customerState.trim()) return { type: "NONE", igst: 0, cgst: 0, sgst: 0, total: 0 };
  const same = customerState.trim().toLowerCase() === cfg.companyState.trim().toLowerCase();
  if (same) {
    const cgst = r((taxable * cfg.cgstRate) / 100);
    const sgst = r((taxable * cfg.sgstRate) / 100);
    return { type: "CGST_SGST", igst: 0, cgst, sgst, total: cgst + sgst };
  }
  const igst = r((taxable * cfg.igstRate) / 100);
  return { type: "IGST", igst, cgst: 0, sgst: 0, total: igst };
}

/** Full quote: service charge + GST on it. `addon` is what gets added to the existing total. */
export function quoteBooking(bookingAmount: number, customerState: string | undefined | null, cfg: BillingConfigData) {
  const serviceCharge = computeServiceCharge(bookingAmount, cfg);
  const gst = computeGst(serviceCharge, customerState, cfg);
  return { serviceCharge, gst, addon: serviceCharge + gst.total };
}

/** Agent commission on a booking amount + GST on the commission. */
export function computeCommission(bookingAmount: number, agentState: string | undefined | null, cfg: BillingConfigData) {
  const commission = r((bookingAmount * (cfg.agentCommissionPercent || 0)) / 100);
  const gst = cfg.commissionGstApplicable ? computeGst(commission, agentState, cfg) : { type: "NONE" as const, igst: 0, cgst: 0, sgst: 0, total: 0 };
  // Agent earns commission + GST (GST charged on their service to us)
  return { commission, gst, credit: commission + gst.total };
}

/** Human label for a GST breakdown line. */
export function gstLabel(g: GstBreakdown, cfg: BillingConfigData): string {
  if (g.type === "IGST") return `IGST (${cfg.igstRate}%)`;
  if (g.type === "CGST_SGST") return `CGST (${cfg.cgstRate}%) + SGST (${cfg.sgstRate}%)`;
  return "GST";
}
