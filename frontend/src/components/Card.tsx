import type { ReactNode } from "react";

export default function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`bg-white border border-neutral-200 rounded-xl p-5 ${className}`}>
      {title && <h2 className="text-sm font-semibold text-neutral-900 mb-4">{title}</h2>}
      {children}
    </section>
  );
}
