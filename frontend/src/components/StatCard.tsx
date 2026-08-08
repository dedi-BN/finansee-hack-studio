export default function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 text-center">
      <p className="text-3xl font-bold text-neutral-900 ltr-nums">{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
