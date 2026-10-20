export default function StatCard({
  label,
  value,
  total,
  dotClass,
}: {
  label: string;
  value: number;
  total?: number;
  dotClass?: string;
}) {
  const share = total ? Math.round((value / total) * 100) : null;
  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-5 flex flex-col gap-2.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-neutral-500">
        {dotClass && <span className={`w-2 h-2 rounded-full ${dotClass}`} aria-hidden />}
        {label}
      </p>
      <p className="text-4xl font-extrabold tracking-tight leading-none text-neutral-900 ltr-nums text-right">
        {value}
      </p>
      {share !== null && dotClass && (
        <div className="h-1.5 rounded-full bg-neutral-100" aria-hidden>
          <div className={`h-full rounded-full ${dotClass}`} style={{ width: `${Math.max(share, 2)}%` }} />
        </div>
      )}
    </div>
  );
}
