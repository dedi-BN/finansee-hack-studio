import type { TextareaHTMLAttributes } from "react";

interface WritingFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  internal?: boolean;
  helper?: string;
  rows?: TextareaHTMLAttributes<HTMLTextAreaElement>["rows"];
}

export default function WritingField({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 90,
  internal = false,
  helper,
  rows,
}: WritingFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="text-[13px] font-bold text-neutral-600">
          {label}
        </label>
        {internal && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-fin-amber-soft text-fin-amber-ink border border-[hsl(45_70%_85%)]">
            פנימי · לא מוצג בפרסום
          </span>
        )}
      </div>
      {helper && <p className="text-xs text-neutral-400 mb-2">{helper}</p>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{ minHeight }}
        className="w-full resize-y border-0 border-b border-transparent hover:border-neutral-200 focus:border-neutral-400 bg-transparent text-[15px] leading-relaxed text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-colors py-1"
      />
    </div>
  );
}
