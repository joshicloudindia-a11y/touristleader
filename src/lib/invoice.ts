import { formatINR } from "./utils";

export interface InvoiceData {
  ref: string;
  pnr: string;
  name: string;
  email?: string;
  phone?: string;
  // booking kind controls labels (defaults to FLIGHT for backward compat)
  kind?: "FLIGHT" | "BUS" | "HOTEL";
  // generic details card: pass detailsTitle + detailLines for bus/hotel
  detailsTitle?: string;
  detailLines?: string[];
  // legacy flight fields (used when detailLines is not provided)
  airline?: string;
  flightNo?: string;
  fromCode?: string;
  toCode?: string;
  fromCity?: string;
  toCity?: string;
  dateLabel: string;
  timeLabel?: string;
  cabin?: string;
  fareLabel?: string;
  pax: number;
  base: number;
  taxes: number;
  addOns: number;
  convenience: number;
  serviceCharge?: number;
  igst?: number;
  cgst?: number;
  sgst?: number;
  total: number;
  invDate: string;
}

const PNR_LABEL: Record<string, string> = { FLIGHT: "PNR", BUS: "Ticket No.", HOTEL: "Confirmation No." };

/** Branded, print-ready HTML invoice (same design as the confirmation page). */
export function buildInvoiceHtml(d: InvoiceData, origin: string): string {
  const kind = d.kind || "FLIGHT";
  const unitWord = kind === "HOTEL" ? "guest" : kind === "BUS" ? "passenger" : "traveller";
  const rows = [
    ["Base fare", `× ${d.pax} ${unitWord}${d.pax > 1 ? "s" : ""}`, formatINR(d.base)],
    ["Taxes & fees", "", formatINR(d.taxes)],
    ...(d.addOns > 0 ? [["Add-ons", "", formatINR(d.addOns)]] : []),
    ...(d.convenience > 0 ? [["Convenience fee", "non-refundable", formatINR(d.convenience)]] : []),
    ...(d.serviceCharge && d.serviceCharge > 0 ? [["Service charge", "", formatINR(d.serviceCharge)]] : []),
    ...(d.igst && d.igst > 0 ? [["IGST", "", formatINR(d.igst)]] : []),
    ...(d.cgst && d.cgst > 0 ? [["CGST", "", formatINR(d.cgst)]] : []),
    ...(d.sgst && d.sgst > 0 ? [["SGST", "", formatINR(d.sgst)]] : []),
  ];
  const detailsTitle = d.detailsTitle || (kind === "BUS" ? "Bus Details" : kind === "HOTEL" ? "Stay Details" : "Flight Details");
  const detailLines = d.detailLines || [
    `<b>${d.airline || "-"} ${d.flightNo || ""}</b>`,
    `${d.fromCity} (${d.fromCode}) &rarr; ${d.toCity} (${d.toCode})`,
    `${d.dateLabel}${d.timeLabel ? ` &middot; ${d.timeLabel}` : ""}`,
    `${d.cabin || "-"} &middot; ${d.fareLabel || "-"} &middot; ${d.pax} traveller${d.pax > 1 ? "s" : ""}`,
  ];
  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${d.ref}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1e293b;background:#f1f5f9;padding:28px}
  .inv{max-width:760px;margin:auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(2,6,23,.10)}
  .top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:30px 34px;background:linear-gradient(135deg,#0a4fa8 0%,#0b63d6 55%,#38bdf8 100%);color:#fff}
  .brand{display:flex;align-items:center;gap:13px}
  .brand img{width:50px;height:50px;border-radius:50%;background:#fff;padding:3px;object-fit:contain}
  .brand .name{font-size:23px;font-weight:800;letter-spacing:-.5px;line-height:1}
  .brand .sub{font-size:12px;opacity:.9;margin-top:5px}
  .meta{text-align:right;line-height:1.5}
  .meta .lbl{opacity:.85;font-size:10px;text-transform:uppercase;letter-spacing:1px}
  .meta .val{font-weight:700;font-size:16px}
  .paid{display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.55);padding:4px 13px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:1px}
  .body{padding:26px 34px}
  .cards{display:flex;gap:16px;flex-wrap:wrap}
  .card{flex:1;min-width:230px;background:#f8fafc;border:1px solid #e8edf3;border-radius:13px;padding:16px}
  .card h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:9px}
  .card .line{font-size:13px;margin:4px 0;color:#334155}
  .card .line b{color:#0f172a}
  h3{font-size:13px;text-transform:uppercase;letter-spacing:.5px;color:#475569;margin:26px 0 6px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  thead td{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;border-bottom:2px solid #e2e8f0;padding:9px 0}
  tbody td{padding:11px 0;border-bottom:1px solid #f1f5f9}
  tbody td .s{color:#94a3b8;font-size:12px;margin-left:6px}
  .r{text-align:right;font-variant-numeric:tabular-nums}
  .total{display:flex;justify-content:space-between;align-items:center;margin-top:18px;background:linear-gradient(135deg,#0b63d6,#38bdf8);color:#fff;border-radius:13px;padding:15px 20px}
  .total .t1{font-weight:600;font-size:14px}
  .total .t2{font-size:23px;font-weight:800;font-variant-numeric:tabular-nums}
  .foot{padding:18px 34px;background:#f8fafc;border-top:1px solid #e8edf3;font-size:11px;color:#94a3b8;line-height:1.7}
  @media print{body{background:#fff;padding:0}.inv{box-shadow:none;border-radius:0}}
</style></head><body>
  <div class="inv">
    <div class="top">
      <div class="brand">
        <img src="${origin}/logo.avif" alt="Tourist Leader"/>
        <div><div class="name">Tourist Leader</div><div class="sub">Comfort before, during, and after take off</div></div>
      </div>
      <div class="meta">
        <div class="lbl">Invoice / Booking ID</div><div class="val">${d.ref}</div>
        <div class="lbl" style="margin-top:8px">${PNR_LABEL[kind]}</div><div class="val">${d.pnr}</div>
        <div class="paid">&#9679; PAID</div>
      </div>
    </div>
    <div class="body">
      <div class="cards">
        <div class="card"><h4>Billed To</h4>
          <div class="line"><b>${d.name}</b></div>
          ${d.email ? `<div class="line">${d.email}</div>` : ""}
          ${d.phone ? `<div class="line">${d.phone}</div>` : ""}
        </div>
        <div class="card"><h4>${detailsTitle}</h4>
          ${detailLines.map((l) => `<div class="line">${l}</div>`).join("")}
        </div>
      </div>
      <h3>Fare Breakdown</h3>
      <table>
        <thead><tr><td>Description</td><td class="r">Amount</td></tr></thead>
        <tbody>${rows.map((r) => `<tr><td>${r[0]}<span class="s">${r[1]}</span></td><td class="r">${r[2]}</td></tr>`).join("")}</tbody>
      </table>
      <div class="total"><span class="t1">Total Paid (incl. GST)</span><span class="t2">${formatINR(d.total)}</span></div>
    </div>
    <div class="foot">
      Invoice date: ${d.invDate} &nbsp;&middot;&nbsp; This is a computer-generated invoice and does not require a signature.<br/>
      Convenience fee is non-refundable. For assistance, contact help@touristleader.com. &copy; ${new Date().getFullYear()} Tourist Leader.com
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`;
}

export function openInvoice(html: string, ref: string) {
  const w = window.open("", "_blank", "width=820,height=960");
  if (w) {
    w.document.write(html);
    w.document.close();
    return true;
  }
  // popup blocked → download
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Tourist Leader-Invoice-${ref}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return false;
}

export async function shareBooking(text: string, onCopied: () => void) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title: "Tourist Leader Booking", text, url });
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      onCopied();
    }
  } catch {
    /* user cancelled */
  }
}
