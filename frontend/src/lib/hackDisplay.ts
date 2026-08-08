import type { Hack } from "../types";

type Audience = Pick<Hack, "age_groups" | "family_status" | "employment" | "financial_status">;

export function categoryLabel(hack: Pick<Hack, "expertise">): string {
  return hack.expertise[0] ?? "—";
}

function audienceParts(hack: Audience): string[] {
  return [
    ...hack.age_groups,
    ...hack.family_status,
    ...hack.employment,
    ...hack.financial_status,
  ].filter((v) => v !== "כולם");
}

export function audienceSummary(hack: Audience): string {
  const parts = audienceParts(hack);
  if (parts.length === 0) return "כולם";
  const shown = parts.slice(0, 2).join(", ");
  return parts.length > 2 ? `${shown} ‎+${parts.length - 2}` : shown;
}

export function primaryAudience(hack: Audience): string {
  const parts = audienceParts(hack);
  return parts[0] ?? "כולם";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
