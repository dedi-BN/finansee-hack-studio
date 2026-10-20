import type { HackStatus } from "../types";

export const STATUS_STYLES: Record<HackStatus, { chip: string; dot: string }> = {
  Draft: { chip: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400" },
  "Professional Review": { chip: "bg-fin-amber-soft text-fin-amber-ink", dot: "bg-fin-amber" },
  Approved: { chip: "bg-fin-blue-soft text-fin-blue-ink", dot: "bg-fin-blue" },
  Published: { chip: "bg-fin-green-soft text-fin-green", dot: "bg-fin-green" },
};

export const STATUS_DOT = Object.fromEntries(
  Object.entries(STATUS_STYLES).map(([k, v]) => [k, v.dot]),
) as Record<HackStatus, string>;
