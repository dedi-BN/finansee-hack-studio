import type { HackStatus } from "./types";

export const AGE_GROUPS = ["18-25", "26-35", "36-45", "46-55", "56+", "כולם"];
export const FAMILY_STATUS = ["רווקים", "זוגות", "נשואים", "הורים", "משפחה חד־הורית", "כולם"];
export const EMPLOYMENT = ["שכירים", "עצמאים", "בעלי חברה", "שכירים ועצמאים", "סטודנטים", "כולם"];
export const FINANCIAL_STATUS = [
  "בתחילת הדרך",
  "במינוס",
  "עם הלוואות",
  "מאוזנים",
  "מתחילים לחסוך",
  "חוסכים",
  "משקיעים מתחילים",
  "משקיעים מתקדמים",
  "בעלי משכנתא",
  "לקראת פרישה",
  "כולם",
];
export const EXPERTISE = [
  "פנסיה",
  "ביטוח",
  "השקעות",
  "משכנתאות",
  "מיסוי",
  "קרן השתלמות",
  "קופות גמל",
  "בנקאות",
  "אשראי",
  "כלכלת המשפחה",
];

export const STATUS_OPTIONS: { value: HackStatus; label: string }[] = [
  { value: "Draft", label: "טיוטה" },
  { value: "Professional Review", label: "בדיקה מקצועית" },
  { value: "Approved", label: "מאושר" },
  { value: "Published", label: "פורסם" },
];

export const STATUS_LABELS: Record<HackStatus, string> = STATUS_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<HackStatus, string>,
);

export const SCORE_FIELDS = [
  { key: "importance", label: "חשיבות" },
  { key: "virality", label: "ויראליות" },
  { key: "potential_savings", label: "פוטנציאל חיסכון" },
  { key: "urgency", label: "דחיפות" },
] as const;
