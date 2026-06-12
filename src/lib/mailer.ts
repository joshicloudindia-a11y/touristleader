import nodemailer from "nodemailer";
import { AIRPORTS } from "./constants";

const BASE = (process.env.NEXT_PUBLIC_BASE_URL || "https://touristleader.com").replace(/\/$/, "");
const LOGO = `${BASE}/logo.png`;
const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
const cityName = (code: string) => AIRPORTS.find((a) => a.code === code)?.city || code;

/** Branded responsive email shell (table-based for client compatibility). */
function emailShell(hero: { title: string; sub: string }, inner: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#eef2f7;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#1e293b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:24px 12px">
      <tr><td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(2,6,23,.10)">
          <tr><td style="background:linear-gradient(135deg,#0a4fa8 0%,#0b63d6 55%,#38bdf8 100%);padding:22px 28px">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="vertical-align:middle"><img src="${LOGO}" alt="Tourist Leader" width="44" height="44" style="display:block;border-radius:50%;background:#fff;padding:3px"></td>
              <td style="vertical-align:middle;padding-left:12px">
                <div style="font-size:20px;font-weight:800;color:#fff;line-height:1">Tourist Leader</div>
                <div style="font-size:12px;color:rgba(255,255,255,.85);margin-top:4px">Comfort before, during, and after take off</div>
              </td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:26px 28px 8px;text-align:center">
            <div style="display:inline-block;width:54px;height:54px;line-height:54px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:28px;font-weight:700">&#10003;</div>
            <h1 style="margin:14px 0 2px;font-size:22px;color:#0f172a">${hero.title}</h1>
            <p style="margin:0;color:#64748b;font-size:14px">${hero.sub}</p>
          </td></tr>
          <tr><td style="padding:18px 28px 4px">${inner}</td></tr>
          <tr><td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e8edf3">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.7">
              <b style="color:#475569">Make travel caring, seamless, and sustainable.</b><br>
              Need help? Reply to this email or visit <a href="${BASE}/help" style="color:#0b63d6;text-decoration:none">touristleader.com/help</a> &middot; &copy; ${new Date().getFullYear()} Tourist Leader.com
            </p>
          </td></tr>
        </table>
        <p style="margin:14px 0 0;font-size:11px;color:#94a3b8">This is a computer-generated confirmation. Convenience fee is non-refundable.</p>
      </td></tr>
    </table>
  </body></html>`;
}

function refBar(leftLabel: string, leftVal: string, rightLabel: string, rightVal: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;padding:14px 16px;margin-bottom:16px">
    <tr>
      <td style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">${leftLabel}<div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:2px">${leftVal}</div></td>
      <td align="right" style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.5px">${rightLabel}<div style="font-size:16px;font-weight:800;color:#0b63d6;margin-top:2px">${rightVal}</div></td>
    </tr></table>`;
}

function row(label: string, value: string, strong = false) {
  return `<tr><td style="padding:9px 0;color:#64748b;font-size:14px;border-bottom:1px solid #f1f5f9">${label}</td><td align="right" style="padding:9px 0;font-size:14px;font-weight:${strong ? 700 : 600};color:#0f172a;border-bottom:1px solid #f1f5f9">${value}</td></tr>`;
}

function fareTable(rows: [string, string][], total: number) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px">
    ${rows.map(([l, v]) => row(l, v)).join("")}
    <tr><td style="padding:12px 0 0;font-size:15px;font-weight:800;color:#0f172a">Total Paid</td><td align="right" style="padding:12px 0 0;font-size:18px;font-weight:800;color:#0f172a">${inr(total)}</td></tr>
  </table>`;
}

function sectionTitle(t: string) {
  return `<p style="margin:18px 0 6px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#94a3b8">${t}</p>`;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || "true") === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

const MAIL_FROM = process.env.MAIL_FROM || `Tourist Leader <${process.env.SMTP_USER || "no-reply@touristleader.com"}>`;
const REPLY_TO = process.env.MAIL_REPLY_TO || process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

/** Strip HTML to a readable plain-text fallback (multipart e-mails land in inbox far more often than HTML-only). */
function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<\/(p|div|tr|h[1-6]|li|table)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&middot;/g, "·").replace(/&rarr;/g, "->")
    .replace(/&amp;/g, "&").replace(/&copy;/g, "(c)").replace(/&#10003;/g, "[ok]")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Single send path for every e-mail. Adds the things that keep messages OUT of spam:
 * a plain-text alternative, a real Reply-To, a matching envelope sender, and
 * legitimacy headers (List-Unsubscribe etc.). `transactional` skips unsubscribe (e.g. OTP).
 */
async function deliver(opts: { to: string; subject: string; html: string; text?: string; replyTo?: string; transactional?: boolean }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[mailer] SMTP not configured, skipping email");
    return { skipped: true } as const;
  }
  const unsubMail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;
  const headers: Record<string, string> = { "X-Mailer": "Tourist Leader" };
  if (!opts.transactional) {
    headers["List-Unsubscribe"] = `<mailto:${unsubMail}?subject=unsubscribe>, <${BASE}/help>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  try {
    const info = await getTransporter().sendMail({
      from: MAIL_FROM,
      sender: process.env.SMTP_USER,
      to: opts.to,
      replyTo: opts.replyTo || REPLY_TO,
      subject: opts.subject,
      text: opts.text || htmlToText(opts.html),
      html: opts.html,
      headers,
    });
    return { messageId: info.messageId } as const;
  } catch (err) {
    console.error("[mailer] send failed:", (err as Error).message);
    return { error: (err as Error).message } as const;
  }
}

export async function sendBookingEmail(opts: {
  to: string;
  bookingRef: string;
  pnr: string;
  html: string;
  subject?: string;
}) {
  return deliver({
    to: opts.to,
    subject: opts.subject || `Booking Confirmed · ${opts.bookingRef} · PNR ${opts.pnr}`,
    html: opts.html,
  });
}

export async function sendOtpEmail(to: string, otp: string) {
  const html = `<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;padding:24px">
    <div style="max-width:440px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
      <div style="background:linear-gradient(135deg,#0a4fa8,#0b63d6);padding:22px;color:#fff">
        <h1 style="margin:0;font-size:19px">Tourist Leader</h1>
        <p style="margin:6px 0 0;opacity:.9;font-size:13px">Comfort before, during, and after take off</p>
      </div>
      <div style="padding:26px;text-align:center">
        <p style="color:#6b7280;margin:0 0 12px">Your one-time login code is</p>
        <div style="font-size:34px;font-weight:800;letter-spacing:10px;color:#0b63d6">${otp}</div>
        <p style="color:#9ca3af;font-size:13px;margin:16px 0 0">This code expires in 10 minutes. Don&apos;t share it with anyone.</p>
      </div>
    </div></body></html>`;
  const text = `Your Tourist Leader login code is ${otp}\n\nThis code expires in 10 minutes. Don't share it with anyone.\n\nIf you didn't request this, you can safely ignore this email.\n— Tourist Leader`;
  return deliver({ to, subject: `${otp} is your Tourist Leader verification code`, html, text, transactional: true });
}

export async function sendSupportTicketEmails(t: {
  ticketNo: string; name: string; email: string; phone?: string;
  category: string; bookingRef?: string; subject: string; message: string;
}) {
  const supportInbox = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;

  // 1. Notify the support team
  const teamHtml = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#0b63d6">New Support Ticket · ${t.ticketNo}</h2>
    <table style="font-size:14px;border-collapse:collapse">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Category</td><td><b>${t.category}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Subject</td><td>${t.subject}</td></tr>
      ${t.bookingRef ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Booking</td><td>${t.bookingRef}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">From</td><td>${t.name} · ${t.email}${t.phone ? ` · ${t.phone}` : ""}</td></tr>
    </table>
    <p style="margin-top:12px;white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${t.message}</p>
  </div>`;

  // 2. Acknowledge the customer
  const userHtml = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0a4fa8,#0b63d6);padding:20px;color:#fff">
      <h2 style="margin:0;font-size:18px">We've received your request</h2>
      <p style="margin:6px 0 0;opacity:.9;font-size:13px">Comfort before, during, and after take off</p>
    </div>
    <div style="padding:22px">
      <p style="margin:0 0 10px">Hi ${t.name}, thanks for reaching out. Your support ticket has been created — our team will get back to you shortly.</p>
      <p style="font-size:15px">Ticket Number: <b style="color:#0b63d6">${t.ticketNo}</b></p>
      <p style="color:#6b7280;font-size:13px"><b>Subject:</b> ${t.subject}<br/><b>Category:</b> ${t.category}</p>
    </div>
  </div>`;

  const r = await Promise.all([
    deliver({ to: supportInbox, replyTo: t.email, subject: `Ticket ${t.ticketNo} · ${t.category} · ${t.subject}`, html: teamHtml, transactional: true }),
    deliver({ to: t.email, subject: `We've received your request — Ticket ${t.ticketNo}`, html: userHtml, transactional: true }),
  ]);
  return r.some((x) => "error" in x) ? { error: "partial failure" } : { ok: true };
}

export async function sendPackageEnquiryEmails(e: {
  enquiryNo: string; packageTitle: string; name: string; email: string; phone: string;
  travelMonth?: string; adults: number; children: number; message?: string;
}) {
  const inbox = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;

  const team = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#0b63d6">New Holiday Package Enquiry · ${e.enquiryNo}</h2>
    <table style="font-size:14px"><tr><td style="padding:4px 12px 4px 0;color:#64748b">Package</td><td><b>${e.packageTitle}</b></td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#64748b">Travel month</td><td>${e.travelMonth || "-"}</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#64748b">Travellers</td><td>${e.adults} adults, ${e.children} children</td></tr>
    <tr><td style="padding:4px 12px 4px 0;color:#64748b">Contact</td><td>${e.name} · ${e.email} · ${e.phone}</td></tr></table>
    ${e.message ? `<p style="margin-top:12px;background:#f8fafc;padding:12px;border-radius:8px">${e.message}</p>` : ""}</div>`;

  const inner = `
    ${refBar("Enquiry No.", e.enquiryNo, "Package", e.packageTitle.length > 22 ? e.packageTitle.slice(0, 22) + "…" : e.packageTitle)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${e.name}, thanks for your interest in <b>${e.packageTitle}</b>. Our holiday expert will call you shortly with a customised quote.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Travel month</td><td align="right" style="font-weight:600">${e.travelMonth || "Flexible"}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Travellers</td><td align="right" style="font-weight:600">${e.adults} adults${e.children ? `, ${e.children} children` : ""}</td></tr>
    </table>
    ${sectionTitle("What's next")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Our team will reach out within a few hours with the best price, itinerary options and payment details. You can also call us at +91 9987-495-897.</p>`;

  const r = await Promise.all([
    deliver({ to: inbox, replyTo: e.email, subject: `Package Enquiry ${e.enquiryNo} · ${e.packageTitle}`, html: team, transactional: true }),
    deliver({ to: e.email, subject: `We've got your enquiry — ${e.packageTitle} (${e.enquiryNo})`, html: emailShell({ title: "Enquiry Received", sub: e.packageTitle }, inner), transactional: true }),
  ]);
  return r.some((x) => "error" in x) ? { error: "partial failure" } : { ok: true };
}

export async function sendVisaEnquiryEmails(e: {
  enquiryNo: string; country: string; purpose: string; travellers: number;
  onwardDate?: string; returnDate?: string; name: string; email: string; phone: string; message?: string;
}) {
  const inbox = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;
  const team = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#0b63d6">New Visa Enquiry · ${e.enquiryNo}</h2>
    <table style="font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Country</td><td><b>${e.country}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Purpose</td><td>${e.purpose}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Travellers</td><td>${e.travellers}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Onward</td><td>${e.onwardDate || "-"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Return</td><td>${e.returnDate || "-"}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Contact</td><td>${e.name} · ${e.email} · ${e.phone}</td></tr>
    </table>
    ${e.message ? `<p style="margin-top:12px;background:#f8fafc;padding:12px;border-radius:8px">${e.message}</p>` : ""}</div>`;

  const inner = `
    ${refBar("Enquiry No.", e.enquiryNo, "Country", e.country.length > 22 ? e.country.slice(0, 22) + "…" : e.country)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${e.name}, thanks for your visa enquiry for <b>${e.country}</b>. Our visa expert will reach out shortly to guide you through the process.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Purpose</td><td align="right" style="font-weight:600">${e.purpose}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Travellers</td><td align="right" style="font-weight:600">${e.travellers}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Tentative dates</td><td align="right" style="font-weight:600">${e.onwardDate || "Flexible"}${e.returnDate ? ` → ${e.returnDate}` : ""}</td></tr>
    </table>
    ${sectionTitle("What's next")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Our team will contact you with the document checklist, fees and processing time. You can also call us at +91 9987-495-897.</p>`;

  const r = await Promise.all([
    deliver({ to: inbox, replyTo: e.email, subject: `Visa Enquiry ${e.enquiryNo} · ${e.country}`, html: team, transactional: true }),
    deliver({ to: e.email, subject: `We've got your visa enquiry — ${e.country} (${e.enquiryNo})`, html: emailShell({ title: "Visa Enquiry Received", sub: e.country }, inner), transactional: true }),
  ]);
  return r.some((x) => "error" in x) ? { error: "partial failure" } : { ok: true };
}

export async function sendForexEnquiryEmails(e: {
  enquiryNo: string; type: string; name: string; email: string; phone: string;
  address?: string; pan?: string; currencies?: string[]; amount?: string; message?: string;
}) {
  const inbox = process.env.SUPPORT_EMAIL || process.env.SMTP_USER!;
  const typeLabel = e.type === "CARD" ? "Multi-Currency Forex Card" : "Foreign Currency Notes";
  const team = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#0b63d6">New Forex Enquiry · ${e.enquiryNo}</h2>
    <table style="font-size:14px">
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Request</td><td><b>${typeLabel}</b></td></tr>
      ${e.currencies && e.currencies.length ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Currencies</td><td>${e.currencies.join(", ")}</td></tr>` : ""}
      ${e.amount ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Amount</td><td>${e.amount}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Name</td><td>${e.name}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#64748b">Contact</td><td>${e.email} · ${e.phone}</td></tr>
      ${e.address ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">Address</td><td>${e.address}</td></tr>` : ""}
      ${e.pan ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">PAN</td><td>${e.pan}</td></tr>` : ""}
    </table>
    ${e.message ? `<p style="margin-top:12px;background:#f8fafc;padding:12px;border-radius:8px">${e.message}</p>` : ""}</div>`;

  const inner = `
    ${refBar("Enquiry No.", e.enquiryNo, "Request", typeLabel.length > 22 ? typeLabel.slice(0, 22) + "…" : typeLabel)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${e.name}, thanks for your forex enquiry. Our team will reach out shortly with rates and the next steps.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Request</td><td align="right" style="font-weight:600">${typeLabel}</td></tr>
      ${e.currencies && e.currencies.length ? `<tr><td style="padding:4px 0;color:#64748b">Currencies</td><td align="right" style="font-weight:600">${e.currencies.join(", ")}</td></tr>` : ""}
    </table>
    ${sectionTitle("What's next")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Our forex desk will contact you with live rates, delivery options and the documents needed. You can also call us at +91 9987-495-897.</p>`;

  const r = await Promise.all([
    deliver({ to: inbox, replyTo: e.email, subject: `Forex Enquiry ${e.enquiryNo} · ${typeLabel}`, html: team, transactional: true }),
    deliver({ to: e.email, subject: `We've got your forex enquiry — ${typeLabel} (${e.enquiryNo})`, html: emailShell({ title: "Forex Enquiry Received", sub: typeLabel }, inner), transactional: true }),
  ]);
  return r.some((x) => "error" in x) ? { error: "partial failure" } : { ok: true };
}

export async function sendTicketReplyEmail(opts: {
  to: string; ticketNo: string; subject: string; body: string; toCustomer: boolean; customerName?: string;
}) {
  const inner = `
    ${refBar("Ticket", opts.ticketNo, "Subject", opts.subject.length > 24 ? opts.subject.slice(0, 24) + "…" : opts.subject)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">${opts.toCustomer ? `Hi ${opts.customerName || "there"}, our support team has replied to your ticket:` : "New customer reply on a support ticket:"}</p>
    <div style="white-space:pre-wrap;background:#f8fafc;border-left:3px solid #0b63d6;border-radius:8px;padding:14px 16px;font-size:14px;color:#334155">${opts.body.replace(/</g, "&lt;")}</div>
    ${opts.toCustomer ? `${sectionTitle("Need to add more?")}<p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Just reply to this email or open My Tickets on touristleader.com to continue the conversation.</p>` : ""}`;
  const r = await deliver({
    to: opts.to,
    replyTo: opts.toCustomer ? undefined : opts.to,
    subject: `${opts.toCustomer ? "Re: " : "Customer reply · "}${opts.ticketNo} · ${opts.subject}`,
    html: emailShell({ title: opts.toCustomer ? "Support replied" : "New ticket reply", sub: opts.subject }, inner),
    transactional: true,
  });
  return "error" in r ? r : { ok: true };
}

export function busBookingEmailHtml(data: {
  bookingRef: string; ticketNo: string; operator: string; busType: string;
  from: string; to: string; departTime: string; arriveTime: string;
  boarding: string; boardingTime: string; dropping: string;
  seatIds: string[]; passengerName: string; passengers: number;
  fareTotal: number; taxes: number; convenience: number; total: number;
}) {
  const tm = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateLbl = new Date(data.departTime).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  const inner = `
    ${refBar("Booking ID", data.bookingRef, "Ticket No.", data.ticketNo)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${data.passengerName}, your bus ticket is confirmed. Show this ticket at boarding.</p>
    ${sectionTitle("Journey")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf3;border-radius:12px;padding:14px 16px;margin-bottom:8px">
      <tr><td><div style="font-size:14px;font-weight:700;color:#0f172a">${data.operator}</div><div style="font-size:12px;color:#94a3b8">${data.busType}</div></td><td align="right" style="font-size:12px;color:#94a3b8">${dateLbl}</td></tr>
      <tr><td colspan="2" style="padding-top:12px"><table role="presentation" width="100%"><tr>
        <td><div style="font-size:20px;font-weight:800;color:#0f172a">${tm(data.departTime)}</div><div style="font-size:12px;color:#64748b">${data.from}</div></td>
        <td align="center" style="font-size:18px">&#128652;</td>
        <td align="right"><div style="font-size:20px;font-weight:800;color:#0f172a">${tm(data.arriveTime)}</div><div style="font-size:12px;color:#64748b">${data.to}</div></td>
      </tr></table></td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Seats</td><td align="right" style="font-weight:600">${data.seatIds.join(", ")} (${data.passengers})</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Boarding</td><td align="right" style="font-weight:600">${data.boarding}${data.boardingTime ? ` · ${data.boardingTime}` : ""}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Dropping</td><td align="right" style="font-weight:600">${data.dropping}</td></tr>
    </table>
    ${sectionTitle("Fare breakdown")}
    ${fareTable([[`Base fare (${data.seatIds.length} seat${data.seatIds.length > 1 ? "s" : ""})`, inr(data.fareTotal)], ["Taxes & fees", inr(data.taxes)], ["Convenience fee", inr(data.convenience)]], data.total)}
    ${sectionTitle("Good to know")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Reach the boarding point 15 minutes early. Carry a valid photo ID. Show Booking ID ${data.bookingRef} to the bus operator.</p>`;
  return emailShell({ title: "Bus Ticket Confirmed", sub: `${data.from} → ${data.to} · ${dateLbl}` }, inner);
}

export function bookingEmailHtml(data: {
  bookingRef: string; pnr: string;
  origin: string; destination: string;
  dateLabel: string; departTime: string; arriveTime: string;
  airline: string; flightNumber: string;
  stops: number; durationLabel: string;
  passengerName: string; travellers: number; cabin: string; fareLabel: string;
  cabinBaggage: string; checkInBaggage: string;
  base: number; taxes: number; addOns: number; convenience: number; total: number;
}) {
  const fromCity = cityName(data.origin), toCity = cityName(data.destination);
  const stopsLbl = data.stops === 0 ? "Non-stop" : `${data.stops} stop${data.stops > 1 ? "s" : ""}`;

  const journey = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf3;border-radius:12px;padding:14px 16px;margin-bottom:8px">
      <tr>
        <td><div style="font-size:13px;font-weight:700;color:#0f172a">${data.airline}</div><div style="font-size:12px;color:#94a3b8">${data.flightNumber} &middot; ${data.fareLabel} &middot; ${data.cabin}</div></td>
        <td align="right" style="font-size:12px;color:#94a3b8">${data.dateLabel}</td>
      </tr>
      <tr><td colspan="2" style="padding-top:12px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:top"><div style="font-size:22px;font-weight:800;color:#0f172a">${data.departTime}</div><div style="font-size:12px;color:#64748b">${data.origin} &middot; ${fromCity}</div></td>
          <td align="center" style="font-size:11px;color:#94a3b8;vertical-align:middle">${data.durationLabel}<br>&#9992;<br><span style="color:#0b63d6;font-weight:600">${stopsLbl}</span></td>
          <td align="right" style="vertical-align:top"><div style="font-size:22px;font-weight:800;color:#0f172a">${data.arriveTime}</div><div style="font-size:12px;color:#64748b">${data.destination} &middot; ${toCity}</div></td>
        </tr></table>
      </td></tr>
    </table>`;

  const details = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Lead passenger</td><td align="right" style="font-weight:600">${data.passengerName}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Travellers</td><td align="right" style="font-weight:600">${data.travellers}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Baggage</td><td align="right" style="font-weight:600">Cabin ${data.cabinBaggage} &middot; Check-in ${data.checkInBaggage}</td></tr>
    </table>`;

  const inner = `
    ${refBar("Booking ID", data.bookingRef, "PNR", data.pnr)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${data.passengerName}, your trip is all set. Here are your booking details.</p>
    ${sectionTitle("Flight")}
    ${journey}
    ${details}
    ${sectionTitle("Fare breakdown")}
    ${fareTable([[`Base fare (${data.travellers} traveller${data.travellers > 1 ? "s" : ""})`, inr(data.base)], ["Taxes & fees", inr(data.taxes)], ...(data.addOns ? [["Add-ons (seats / meals)", inr(data.addOns)] as [string, string]] : []), ["Convenience fee", inr(data.convenience)]], data.total)}
    ${sectionTitle("Good to know")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Carry a valid government photo ID (Aadhaar / PAN / Passport / DL). Web check-in opens 48 hours before departure. Airline cancellation rules apply; convenience fee is non-refundable.</p>`;

  return emailShell({ title: "Booking Confirmed", sub: `${fromCity} → ${toCity} · ${data.dateLabel}` }, inner);
}

export function hotelBookingEmailHtml(data: {
  bookingRef: string; confirmationNo: string;
  hotelName: string; area: string; city: string; starRating: number;
  roomName: string; nights: number; checkIn: string; checkOut: string;
  guestName: string; guests: number; rooms: number;
  roomTotal: number; taxes: number; convenience: number; total: number;
}) {
  const stars = "&#9733;".repeat(data.starRating);
  const inner = `
    ${refBar("Booking ID", data.bookingRef, "Confirmation No.", data.confirmationNo)}
    <p style="margin:0 0 10px;color:#475569;font-size:14px">Hi ${data.guestName}, your stay is confirmed. Here are your booking details.</p>
    ${sectionTitle("Hotel")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf3;border-radius:12px;padding:14px 16px;margin-bottom:8px">
      <tr><td>
        <div style="color:#f59e0b;font-size:13px">${stars}</div>
        <div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:2px">${data.hotelName}</div>
        <div style="font-size:12px;color:#64748b">${data.area}, ${data.city}</div>
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td style="padding:4px 0;color:#64748b">Room</td><td align="right" style="font-weight:600">${data.roomName}</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Stay</td><td align="right" style="font-weight:600">${data.checkIn} → ${data.checkOut} (${data.nights} night${data.nights > 1 ? "s" : ""})</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Guests</td><td align="right" style="font-weight:600">${data.rooms} room${data.rooms > 1 ? "s" : ""}, ${data.guests} guests</td></tr>
      <tr><td style="padding:4px 0;color:#64748b">Check-in / out</td><td align="right" style="font-weight:600">2 PM / 11 AM</td></tr>
    </table>
    ${sectionTitle("Price breakdown")}
    ${fareTable([[`Room (${data.nights} night${data.nights > 1 ? "s" : ""})`, inr(data.roomTotal)], ["Taxes & service fees", inr(data.taxes)], ["Convenience fee", inr(data.convenience)]], data.total)}
    ${sectionTitle("Good to know")}
    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7">Carry a valid government photo ID at check-in. Show this confirmation (Booking ID ${data.bookingRef}) at the hotel reception. Convenience fee is non-refundable.</p>`;

  return emailShell({ title: "Stay Booked", sub: `${data.hotelName}, ${data.city} · ${data.checkIn} → ${data.checkOut}` }, inner);
}
