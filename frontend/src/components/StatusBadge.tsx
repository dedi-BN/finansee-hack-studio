import { STATUS_LABELS } from "../constants";
import { STATUS_STYLES } from "../lib/statusStyle";
import type { HackStatus } from "../types";

export default function StatusBadge({ status }: { status: HackStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${style.chip}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden />
      {STATUS_LABELS[status]}
    </span>
  );
}
