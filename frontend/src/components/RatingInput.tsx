export default function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-neutral-600">{label}</span>
      <div className="flex gap-1 ltr-nums">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label} ${n}`}
            className={`w-7 h-7 rounded-md text-xs font-medium border transition-colors ${
              n <= value
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-400 border-neutral-300 hover:border-neutral-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
