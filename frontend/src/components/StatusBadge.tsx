import { STATUS_LABELS } from "../constants";
import type { HackStatus } from "../types";

const STYLES: Record<HackStatus, string> = {
  Draft: "bg-neutral-100 text-neutral-700",
  "Professional Review": "bg-amber-100 text-amber-800",
  Approved: "bg-blue-100 text-blue-800",
  Published: "bg-emerald-100 text-emerald-800",
};

export default function StatusBadge({ status }: { status: HackStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
