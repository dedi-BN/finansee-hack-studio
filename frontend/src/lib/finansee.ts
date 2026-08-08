// The "How Finansee Helps You" section has 5 parts, but the data model has
// no dedicated columns for it (by design - no schema changes). Instead it is
// serialized as plain text into the existing `cta` field using "## Label"
// markers, and parsed back into structured parts for editing/rendering.
// This keeps the database and API untouched while giving editors a
// structured, five-part writing experience and a rich Preview box.

export const FINANSEE_SECTION_LABELS = {
  knows: "מה Finansee כבר יודעת",
  needed: "מה עוד נדרש ממך",
  analyzes: "מה Finansee תבדוק עבורך",
  receives: "מה תקבלו",
  nextStep: "הצעד הבא",
} as const;

export type FinanseeSectionKey = keyof typeof FINANSEE_SECTION_LABELS;

export type FinanseeSection = Record<FinanseeSectionKey, string>;

const EMPTY_SECTION: FinanseeSection = {
  knows: "",
  needed: "",
  analyzes: "",
  receives: "",
  nextStep: "",
};

const LABEL_TO_KEY = new Map<string, FinanseeSectionKey>(
  (Object.entries(FINANSEE_SECTION_LABELS) as [FinanseeSectionKey, string][]).map(([key, label]) => [
    label,
    key,
  ]),
);

export function parseFinanseeSection(text: string): FinanseeSection {
  const result: FinanseeSection = { ...EMPTY_SECTION };
  if (!text) return result;

  let currentKey: FinanseeSectionKey | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentKey) result[currentKey] = buffer.join("\n").trim();
    buffer = [];
  };

  for (const line of text.split("\n")) {
    const match = line.match(/^##\s+(.+)$/);
    const key = match ? LABEL_TO_KEY.get(match[1].trim()) : undefined;
    if (key) {
      flush();
      currentKey = key;
    } else {
      buffer.push(line);
    }
  }
  flush();

  return result;
}

export function serializeFinanseeSection(section: FinanseeSection): string {
  return (Object.keys(FINANSEE_SECTION_LABELS) as FinanseeSectionKey[])
    .map((key) => `## ${FINANSEE_SECTION_LABELS[key]}\n${section[key].trim()}`)
    .join("\n\n");
}

export function isFinanseeSectionEmpty(section: FinanseeSection): boolean {
  return Object.values(section).every((v) => !v.trim());
}
