/** Minimum travellers for a group booking query. Below this, use a normal booking. */
export const GROUP_MIN_TRAVELLERS = 10;

/** Lifecycle of a group booking enquiry (mirrors the other lead pipelines). */
export const GROUP_STATUSES = ["NEW", "CONTACTED", "QUOTED", "BOOKED", "CLOSED"] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export const GROUP_STATUS_META: Record<GroupStatus, { label: string; cls: string }> = {
  NEW: { label: "New", cls: "bg-sky-100 text-sky-700" },
  CONTACTED: { label: "Contacted", cls: "bg-amber-100 text-amber-700" },
  QUOTED: { label: "Quoted", cls: "bg-violet-100 text-violet-700" },
  BOOKED: { label: "Booked", cls: "bg-emerald-100 text-emerald-700" },
  CLOSED: { label: "Closed", cls: "bg-slate-100 text-slate-500" },
};
