// Finansee's three category palettes, mapped to the Studio's domains.
// Pension & savings = assets (teal), insurance = violet, loans & banking =
// liabilities (blue). Tax and family finance have no category colour in the
// design system, so they use the neutral ink tone.

export type DomainTone = "teal" | "violet" | "blue" | "ink";

const TONE_BY_DOMAIN: Record<string, DomainTone> = {
  פנסיה: "teal",
  השקעות: "teal",
  "קרן השתלמות": "teal",
  "קופות גמל": "teal",
  ביטוח: "violet",
  משכנתאות: "blue",
  אשראי: "blue",
  בנקאות: "blue",
};

export function domainTone(domain: string | undefined): DomainTone {
  return (domain && TONE_BY_DOMAIN[domain]) || "ink";
}

export const CHIP_CLASS: Record<DomainTone, string> = {
  teal: "bg-fin-teal-soft text-fin-teal-ink",
  violet: "bg-fin-violet-soft text-fin-violet-ink",
  blue: "bg-fin-blue-soft text-fin-blue-ink",
  ink: "bg-neutral-100 text-neutral-700",
};

export const ACCENT_CLASS: Record<DomainTone, string> = {
  teal: "bg-fin-teal",
  violet: "bg-fin-violet",
  blue: "bg-fin-blue",
  ink: "bg-neutral-700",
};

// Article hero: the category's deep gradient (ink uses Finansee's premium black).
export const HERO_GRADIENT: Record<DomainTone, string> = {
  teal: "linear-gradient(160deg, hsl(178 80% 14%) 0%, hsl(178 70% 26%) 65%, hsl(174 65% 38%) 100%)",
  violet: "linear-gradient(160deg, hsl(262 80% 18%) 0%, hsl(262 75% 32%) 65%, hsl(265 78% 48%) 100%)",
  blue: "linear-gradient(160deg, hsl(222 90% 14%) 0%, hsl(222 85% 28%) 65%, hsl(225 90% 45%) 100%)",
  ink: "linear-gradient(160deg, hsl(250 30% 22%) 0%, hsl(250 50% 12%) 60%, hsl(262 60% 20%) 100%)",
};
