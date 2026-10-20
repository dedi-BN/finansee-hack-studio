import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listHacks } from "../lib/api";
import { AGE_GROUPS, EMPLOYMENT, EXPERTISE } from "../constants";
import type { Hack } from "../types";
import DomainChip from "../components/DomainChip";
import { categoryLabel, formatDate, primaryAudience } from "../lib/hackDisplay";

const SORT_OPTIONS = [
  { value: "updated_at", label: "עדכון אחרון" },
  { value: "number", label: "מספר" },
  { value: "title", label: "כותרת" },
];

export default function HackList() {
  const navigate = useNavigate();
  const [hacks, setHacks] = useState<Hack[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [age, setAge] = useState("");
  const [employment, setEmployment] = useState("");
  const [sort, setSort] = useState("updated_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      listHacks({ search, category, age, employment, sort, order })
        .then(setHacks)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, category, age, employment, sort, order]);

  const selectClass =
    "min-h-11 border border-neutral-200 rounded-lg px-3 text-sm font-semibold bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-fin-violet";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight">כל ה-Hacks</h1>
          {!loading && (
            <p className="mt-1 text-sm font-medium text-neutral-500">
              <span className="ltr-nums">{hacks.length}</span> תוצאות
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-md p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="flex-1 min-w-[240px] flex items-center gap-2.5 min-h-11 px-3.5 rounded-lg bg-neutral-100 border border-neutral-200 focus-within:ring-2 focus-within:ring-fin-violet">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 shrink-0" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="sr-only">חיפוש</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי כותרת, פתיח או תוכן"
            className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none"
          />
        </label>

        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="">כל הקטגוריות</option>
          {EXPERTISE.map((c) => (
            <option key={c} value={c}>
              {c}
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
          className="min-h-11 min-w-11 border border-neutral-200 rounded-lg px-3 text-sm bg-white hover:bg-neutral-50"
          title="הפוך סדר מיון"
          aria-label={order === "asc" ? "מיון בסדר עולה, לחצו להפוך" : "מיון בסדר יורד, לחצו להפוך"}
        >
          {order === "asc" ? "⬆" : "⬇"}
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="text-neutral-500 text-xs font-bold">
              <tr>
                <th className="px-4 py-3.5 font-bold ltr-nums">מספר</th>
                <th className="px-4 py-3.5 font-bold">כותרת</th>
                <th className="px-4 py-3.5 font-bold">תחום</th>
                <th className="px-4 py-3.5 font-bold">קהל יעד מרכזי</th>
                <th className="px-4 py-3.5 font-bold">עדכון אחרון</th>
              </tr>
            </thead>
            <tbody>
              {hacks.map((hack) => (
                <tr
                  key={hack.id}
                  onClick={() => navigate(`/hacks/${hack.id}`)}
                  className="border-t border-neutral-200 hover:bg-neutral-50 cursor-pointer"
                >
                  <td className="px-4 py-4 font-bold text-neutral-500 ltr-nums text-right">{hack.number}</td>
                  <td className="px-4 py-4 font-bold text-neutral-900 leading-snug min-w-[280px]">{hack.title || "(ללא כותרת)"}</td>
                  <td className="px-4 py-4"><DomainChip domain={categoryLabel(hack)} /></td>
                  <td className="px-4 py-4 text-neutral-600 whitespace-nowrap">{primaryAudience(hack)}</td>
                  <td className="px-4 py-4 text-neutral-500 ltr-nums text-right whitespace-nowrap">{formatDate(hack.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && hacks.length === 0 && (
          <p className="text-center text-neutral-500 py-10 text-sm">לא נמצאו Hacks תואמים</p>
        )}
        {loading && <p className="text-center text-neutral-500 py-10 text-sm">טוען...</p>}
      </div>
    </div>
  );
}
