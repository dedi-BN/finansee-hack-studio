import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listHacks } from "../lib/api";
import { AGE_GROUPS, EMPLOYMENT, EXPERTISE, STATUS_OPTIONS } from "../constants";
import type { Hack } from "../types";
import StatusBadge from "../components/StatusBadge";
import { categoryLabel, formatDate, primaryAudience } from "../lib/hackDisplay";

const SORT_OPTIONS = [
  { value: "updated_at", label: "עדכון אחרון" },
  { value: "number", label: "מספר" },
  { value: "title", label: "כותרת" },
  { value: "status", label: "סטטוס" },
];

export default function HackList() {
  const navigate = useNavigate();
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [age, setAge] = useState("");
  const [employment, setEmployment] = useState("");
  const [sort, setSort] = useState("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      listHacks({ search, category, status, age, employment, sort, order })
        .then(setHacks)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, category, status, age, employment, sort, order]);

  const selectClass =
    "border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">רשימת Hacks</h1>
        <button
          onClick={() => navigate("/hacks/new")}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 transition-colors"
        >
          + Hack חדש
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי כותרת, Hook או תוכן..."
          className="flex-1 min-w-[220px] border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">כל הקטגוריות</option>
          {EXPERTISE.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="">כל הסטטוסים</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select value={age} onChange={(e) => setAge(e.target.value)} className={selectClass}>
          <option value="">כל הגילאים</option>
          {AGE_GROUPS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <select value={employment} onChange={(e) => setEmployment(e.target.value)} className={selectClass}>
          <option value="">כל התעסוקות</option>
          {EMPLOYMENT.map((e2) => (
            <option key={e2} value={e2}>
              {e2}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectClass}>
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              מיון: {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setOrder(order === "asc" ? "desc" : "asc")}
          className="border border-neutral-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-neutral-50"
          title="הפוך סדר מיון"
        >
          {order === "asc" ? "⬆" : "⬇"}
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-neutral-50 text-neutral-500 text-xs">
              <tr>
                <th className="px-4 py-3 font-medium ltr-nums">מספר</th>
                <th className="px-4 py-3 font-medium">כותרת</th>
                <th className="px-4 py-3 font-medium">תחום</th>
                <th className="px-4 py-3 font-medium">קהל יעד מרכזי</th>
                <th className="px-4 py-3 font-medium">סטטוס</th>
                <th className="px-4 py-3 font-medium">עדכון אחרון</th>
              </tr>
            </thead>
            <tbody>
              {hacks.map((hack) => (
                <tr
                  key={hack.id}
                  onClick={() => navigate(`/hacks/${hack.id}`)}
                  className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-neutral-500 ltr-nums">{hack.number}</td>
                  <td className="px-4 py-3 font-medium text-neutral-900">{hack.title || "(ללא כותרת)"}</td>
                  <td className="px-4 py-3 text-neutral-600">{categoryLabel(hack)}</td>
                  <td className="px-4 py-3 text-neutral-600">{primaryAudience(hack)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={hack.status} />
                  </td>
                  <td className="px-4 py-3 text-neutral-500 ltr-nums">{formatDate(hack.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && hacks.length === 0 && (
          <p className="text-center text-neutral-400 py-10 text-sm">לא נמצאו Hacks תואמים</p>
        )}
        {loading && <p className="text-center text-neutral-400 py-10 text-sm">טוען...</p>}
      </div>
    </div>
  );
}
