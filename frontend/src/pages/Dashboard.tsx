import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStats, listHacks } from "../lib/api";
import type { DashboardStats, Hack } from "../types";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import { formatDate } from "../lib/hackDisplay";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Hack[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getStats().then(setStats).catch(console.error);
    listHacks({ sort: "updated_at", order: "desc", limit: 5 }).then(setRecent).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">דשבורד</h1>
      <p className="text-sm text-neutral-500 mb-6">
        כל Hack מוביל למסע Finansee - הלקוח לא מתחיל מאפס, כי Finansee כבר מכירה חלק מהפרופיל
        הפיננסי שלו.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="סה״כ Hacks" value={stats?.total ?? 0} />
        <StatCard label="טיוטות" value={stats?.draft ?? 0} />
        <StatCard label="בבדיקה מקצועית" value={stats?.professional_review ?? 0} />
        <StatCard label="מאושרים" value={stats?.approved ?? 0} />
        <StatCard label="פורסמו" value={stats?.published ?? 0} />
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate("/hacks/new")}
          className="px-6 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700 transition-colors"
        >
          + צור Hack חדש
        </button>
      </div>

      <div className="mt-12">
        <h2 className="text-sm font-semibold text-neutral-500 mb-3">עודכנו לאחרונה</h2>
        <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
          {recent.map((hack) => (
            <button
              key={hack.id}
              onClick={() => navigate(`/hacks/${hack.id}`)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right hover:bg-neutral-50 transition-colors"
            >
              <span className="font-medium text-neutral-900 truncate">
                {hack.title || "(ללא כותרת)"}
              </span>
              <span className="flex items-center gap-3 shrink-0">
                <StatusBadge status={hack.status} />
                <span className="text-xs text-neutral-400 ltr-nums">{formatDate(hack.updated_at)}</span>
              </span>
            </button>
          ))}
          {recent.length === 0 && (
            <p className="text-center text-neutral-400 py-8 text-sm">אין עדיין Hacks</p>
          )}
        </div>
      </div>
    </div>
  );
}
