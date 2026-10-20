import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStats, listHacks } from "../lib/api";
import type { DashboardStats, Hack } from "../types";
import DomainChip from "../components/DomainChip";
import { ACCENT_CLASS, domainTone } from "../lib/domainTone";
import { categoryLabel } from "../lib/hackDisplay";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hacks, setHacks] = useState<Hack[]>([]);

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
    listHacks({ sort: "updated_at", order: "desc" }).then(setHacks).catch(console.error);
  }, []);

  const recent = hacks.slice(0, 6);

  const byDomain = useMemo(() => {
    const counts = new Map<string, number>();
    for (const hack of hacks) {
      const domain = categoryLabel(hack);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [hacks]);
  const maxDomain = byDomain[0]?.[1] ?? 1;
  const total = stats?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <section className="pt-2 pb-2">
        <h1 className="text-4xl md:text-[2.5rem] font-extrabold tracking-tight leading-[1.12]">
          ספריית ה-Hacks.
          <br />
          <span className="fs-gradient">{total} כתבות. תמונה אחת.</span>
        </h1>
        <p className="mt-3 text-[15px] font-medium text-neutral-500 max-w-xl leading-relaxed">
          כל Hack מוביל למסע Finansee. הלקוח לא מתחיל מאפס, כי Finansee כבר מכירה חלק מהפרופיל
          הפיננסי שלו.
        </p>
      </section>


      <div className="flex flex-wrap gap-5 items-start">
        <section className="flex-[999_1_560px] min-w-0 bg-white border border-neutral-200 rounded-xl shadow-md overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
            <h2 className="text-lg font-extrabold">עודכנו לאחרונה</h2>
            <Link to="/hacks" className="min-h-11 inline-flex items-center text-sm font-bold text-fin-violet-ink hover:underline">
              לכל ה-Hacks
            </Link>
          </div>
          {recent.map((hack) => (
            <Link
              key={hack.id}
              to={`/hacks/${hack.id}`}
              className="flex items-center gap-4 px-5 py-3.5 border-t border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              <span className="shrink-0 w-12 text-sm font-bold text-neutral-500 ltr-nums text-right">#{hack.number}</span>
              <span className="flex-1 min-w-0 font-bold leading-snug truncate">{hack.title || "(ללא כותרת)"}</span>
              <span className="hidden sm:inline-flex shrink-0">
                <DomainChip domain={categoryLabel(hack)} />
              </span>
            </Link>
          ))}
          {recent.length === 0 && <p className="text-center text-neutral-500 py-10 text-sm">אין עדיין Hacks</p>}
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-5">
          <section className="bg-white border border-neutral-200 rounded-xl shadow-md p-5 flex flex-col gap-4">
            <h2 className="text-lg font-extrabold">לפי תחום</h2>
            {byDomain.map(([domain, count]) => (
              <div key={domain} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-sm font-semibold">
                  <span>{domain}</span>
                  <span className="font-extrabold ltr-nums">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100" aria-hidden>
                  <div
                    className={`h-full rounded-full ${ACCENT_CLASS[domainTone(domain)]}`}
                    style={{ width: `${Math.round((count / maxDomain) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </section>

        </aside>
      </div>
    </div>
  );
}
