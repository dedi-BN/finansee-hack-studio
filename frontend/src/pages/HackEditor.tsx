import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deleteHack, getHack, updateHack } from "../lib/api";
import {
  AGE_GROUPS,
  EMPLOYMENT,
  EXPERTISE,
  FAMILY_STATUS,
  FINANCIAL_STATUS,
  SCORE_FIELDS,
  STATUS_OPTIONS,
} from "../constants";
import type { Hack, HackInput, HackStatus } from "../types";
import Card from "../components/Card";
import MultiSelectGroup from "../components/MultiSelectGroup";
import RatingInput from "../components/RatingInput";
import StatusBadge from "../components/StatusBadge";
import WritingField from "../components/WritingField";
import AssistantPanel from "../components/AssistantPanel";
import { formatDate } from "../lib/hackDisplay";
import {
  FINANSEE_SECTION_LABELS,
  parseFinanseeSection,
  serializeFinanseeSection,
  type FinanseeSectionKey,
} from "../lib/finansee";

export default function HackEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [hack, setHack] = useState<HackInput | null>(null);
  const [savedHack, setSavedHack] = useState<Hack | null>(null);
  const [saving, setSaving] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"metadata" | "assistant">("metadata");

  useEffect(() => {
    getHack(Number(id))
      .then((data) => {
        setHack(data);
        setSavedHack(data);
      })
      .catch(console.error);
  }, [id]);

  function update<K extends keyof HackInput>(key: K, value: HackInput[K]) {
    setHack((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const finansee = parseFinanseeSection(hack?.cta ?? "");
  function updateFinansee(key: FinanseeSectionKey, value: string) {
    update("cta", serializeFinanseeSection({ ...finansee, [key]: value }));
  }

  async function handleSave() {
    if (!hack) return;
    setSaving(true);
    const payload: HackInput = {
      ...hack,
      action_steps: hack.action_steps.map((s) => s.trim()).filter(Boolean),
    };
    try {
      const updated = await updateHack(Number(id), payload);
      setHack(updated);
      setSavedHack(updated);
    } catch (err) {
      console.error(err);
      alert("שמירה נכשלה, נסו שוב.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!savedHack) return;
    if (!confirm(`למחוק את ה-Hack "${savedHack.title || savedHack.number}"?`)) return;
    await deleteHack(savedHack.id);
    navigate("/hacks");
  }

  if (!hack) {
    return <p className="text-center text-neutral-400 py-10 text-sm">טוען...</p>;
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate("/hacks")}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            → רשימת Hacks
          </button>
          <span className="text-neutral-300">|</span>
          <span className="text-sm text-neutral-500 ltr-nums">Hack #{savedHack?.number}</span>
          <StatusBadge status={hack.status} />
          <span className="text-xs text-neutral-400">
            {savedHack ? `עודכן לאחרונה ${formatDate(savedHack.updated_at)}` : "טרם נשמר"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={!savedHack}
            onClick={() => savedHack && navigate(`/hacks/${savedHack.id}/preview`)}
            className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            תצוגה מקדימה
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-700 disabled:opacity-50"
          >
            {saving ? "שומר..." : "שמירה"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-8 items-start">
        {/* Writing area */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-6 py-8 md:px-14 md:py-12 order-1">
          <input
            value={hack.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="כותרת ה-Hack"
            className="w-full border-0 bg-transparent text-3xl md:text-4xl font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none mb-3"
          />
          <textarea
            value={hack.subtitle}
            onChange={(e) => update("subtitle", e.target.value)}
            placeholder="כותרת משנה - משפט או שניים שמסבירים למה זה חשוב"
            rows={2}
            className="w-full border-0 bg-transparent resize-none text-lg md:text-xl text-neutral-500 placeholder:text-neutral-300 focus:outline-none mb-8 leading-snug"
          />

          <div className="space-y-8">
            <WritingField
              label="פתיח (Hook)"
              value={hack.hook}
              onChange={(v) => update("hook", v)}
              placeholder="הכניסו את הקורא לנושא וגרמו לו להמשיך לקרוא..."
              minHeight={110}
            />

            <div className="border-t border-neutral-100 pt-8">
              <WritingField
                label="למה זה חשוב"
                value={hack.why_it_matters}
                onChange={(v) => update("why_it_matters", v)}
                placeholder="2-5 משפטים שמסבירים לקורא למה כדאי להקדיש לזה תשומת לב עכשיו..."
                minHeight={80}
              />
            </div>

            <WritingField
              label="הבעיה"
              value={hack.problem}
              onChange={(v) => update("problem", v)}
              placeholder="מה אנשים עושים היום, מה הם לא יודעים, מה עלול להשתבש..."
              minHeight={110}
            />

            <WritingField
              label="דוגמה מהחיים"
              value={hack.example_story}
              onChange={(v) => update("example_story", v)}
              placeholder="מקרה היפותטי וברור. אין להציג כמקרה אמיתי ללא אסמכתה."
              minHeight={110}
              helper="דוגמה היפותטית בלבד - לא לטעון שמדובר במקרה אמיתי אם אין מקור."
            />

            <div className="border-t border-neutral-100 pt-8">
              <WritingField
                label="ההסבר המקצועי"
                value={hack.content}
                onChange={(v) => update("content", v)}
                placeholder="גוף התוכן המקצועי המלא..."
                minHeight={440}
              />
            </div>

            <div>
              <label className="text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2 block">
                מה עושים בפועל
              </label>
              <p className="text-xs text-neutral-400 mb-2">כל שורה היא צעד נפרד.</p>
              <textarea
                value={hack.action_steps.join("\n")}
                onChange={(e) => update("action_steps", e.target.value.split("\n"))}
                placeholder={"צעד ראשון...\nצעד שני...\nצעד שלישי..."}
                style={{ minHeight: 130 }}
                className="w-full resize-y border-0 border-b border-transparent hover:border-neutral-200 focus:border-neutral-400 bg-transparent text-[15px] leading-relaxed text-neutral-800 placeholder:text-neutral-300 focus:outline-none transition-colors py-1"
              />
            </div>

            <WritingField
              label="דברים שכדאי לדעת"
              value={hack.cautions}
              onChange={(v) => update("cautions", v)}
              placeholder="מתי ההאק לא מתאים, מתי נדרש ייעוץ מקצועי..."
              minHeight={100}
            />

            <div className="bg-neutral-50 border-r-4 border-neutral-800 rounded-lg px-5 py-4">
              <label className="text-xs font-semibold tracking-wide text-neutral-500 uppercase mb-2 block">
                בשורה התחתונה
              </label>
              <textarea
                value={hack.bottom_line}
                onChange={(e) => update("bottom_line", e.target.value)}
                placeholder="המסר המרכזי במשפט או שניים..."
                rows={2}
                className="w-full border-0 bg-transparent resize-none text-[15px] leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:outline-none"
              />
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-5 py-6 md:px-7 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-blue-950">איך Finansee עוזרת לך</h3>
                <p className="text-xs text-blue-800/70 mt-1 leading-relaxed">
                  Finansee כבר מכירה חלק מהפרופיל הפיננסי שלך - ולכן אתם לא מתחילים מאפס. כל Hack
                  צריך להסתיים בצעד קונקרטי בתוך Finansee, לא בעצה כללית.
                </p>
              </div>

              <WritingField
                label={FINANSEE_SECTION_LABELS.knows}
                value={finansee.knows}
                onChange={(v) => updateFinansee("knows", v)}
                placeholder="מה כבר קיים בפרופיל של הלקוח ב-Finansee - גיל, מוצרים פנסיוניים, ביטוחים, נתוני שכר..."
                minHeight={60}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.needed}
                value={finansee.needed}
                onChange={(v) => updateFinansee("needed", v)}
                placeholder="איזה מידע חסר וצריך לבקש מהלקוח - טופס 106, דוח משכנתא, דף חשבון..."
                minHeight={60}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.analyzes}
                value={finansee.analyzes}
                onChange={(v) => updateFinansee("analyzes", v)}
                placeholder="מה בדיוק המערכת בודקת - השוואת דמי ניהול, איתור כפל ביטוחי..."
                minHeight={60}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.receives}
                value={finansee.receives}
                onChange={(v) => updateFinansee("receives", v)}
                placeholder="מה הלקוח מקבל בסוף - ניתוח אישי, דוח מותאם..."
                minHeight={60}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.nextStep}
                value={finansee.nextStep}
                onChange={(v) => updateFinansee("nextStep", v)}
                placeholder="פעולה קונקרטית בתוך Finansee, למשל: העלו את דוח הפנסיה שלכם"
                minHeight={50}
                helper="תמיד פעולה בתוך Finansee - לא 'לכו לבדוק' או 'דברו עם מישהו'."
              />
            </div>

          </div>
        </div>

        {/* Sidebar: metadata / AI assistant */}
        <aside className="lg:sticky lg:top-6 space-y-4 order-2">
          <div className="flex gap-1.5 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setSidebarTab("metadata")}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sidebarTab === "metadata" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"
              }`}
            >
              מטא-דאטה
            </button>
            <button
              onClick={() => setSidebarTab("assistant")}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                sidebarTab === "assistant" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500"
              }`}
            >
              🤖 עוזר AI
            </button>
          </div>

          {sidebarTab === "metadata" ? (
            <div className="space-y-4">
              <Card title="תחום מקצועי">
                {hack.expertise[0] && (
                  <p className="text-sm mb-3">
                    <span className="text-neutral-400">תחום ראשי: </span>
                    <span className="font-semibold text-neutral-900">{hack.expertise[0]}</span>
                  </p>
                )}
                <MultiSelectGroup
                  label="ניתן לבחור יותר מתחום אחד"
                  options={EXPERTISE}
                  selected={hack.expertise}
                  onChange={(v) => update("expertise", v)}
                />
              </Card>

              <Card title="קהל יעד">
                <div className="space-y-5">
                  <MultiSelectGroup
                    label="גיל"
                    options={AGE_GROUPS}
                    selected={hack.age_groups}
                    onChange={(v) => update("age_groups", v)}
                  />
                  <MultiSelectGroup
                    label="מצב משפחתי"
                    options={FAMILY_STATUS}
                    selected={hack.family_status}
                    onChange={(v) => update("family_status", v)}
                  />
                  <MultiSelectGroup
                    label="סוג תעסוקה"
                    options={EMPLOYMENT}
                    selected={hack.employment}
                    onChange={(v) => update("employment", v)}
                  />
                  <MultiSelectGroup
                    label="מצב כלכלי"
                    options={FINANCIAL_STATUS}
                    selected={hack.financial_status}
                    onChange={(v) => update("financial_status", v)}
                  />
                </div>
              </Card>

              <Card title="דירוגים">
                <div className="divide-y divide-neutral-100">
                  {SCORE_FIELDS.map((field) => (
                    <RatingInput
                      key={field.key}
                      label={field.label}
                      value={hack[field.key]}
                      onChange={(v) => update(field.key, v)}
                    />
                  ))}
                </div>
              </Card>

              <Card title="סטטוס">
                <select
                  value={hack.status}
                  onChange={(e) => update("status", e.target.value as HackStatus)}
                  className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Card>

              {savedHack && (
                <div className="text-left pt-1">
                  <button
                    onClick={handleDelete}
                    className="text-xs text-red-500 hover:text-red-700 hover:underline"
                  >
                    מחיקת ה-Hack הזה
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AssistantPanel hack={hack} />
          )}
        </aside>
      </div>
    </div>
  );
}
