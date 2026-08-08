import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createHack } from "../lib/api";
import { AGE_GROUPS, EMPLOYMENT, EXPERTISE, FAMILY_STATUS, FINANCIAL_STATUS } from "../constants";
import type { FinanseeSection } from "../lib/finansee";
import { FINANSEE_SECTION_LABELS } from "../lib/finansee";
import {
  CORE_MESSAGE_OPTIONS,
  detectCategory,
  generateDraft,
  generateTitles,
  suggestFinanseeSection,
  type AudienceAnswers,
} from "../lib/draftAssistant";
import MultiSelectGroup from "../components/MultiSelectGroup";
import WritingField from "../components/WritingField";

const TOPIC_EXAMPLES = ["החזר מס", "דמי ניהול בפנסיה", "קרן השתלמות", "ביטוחים כפולים", "משכנתא", "השקעות"];

const STEP_LABELS = ["נושא", "מסר מרכזי", "קהל יעד", "Finansee", "כותרת", "יצירה"];

export default function AiAssistant() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [topic, setTopic] = useState("");
  const [expertise, setExpertise] = useState("");

  const [coreMessage, setCoreMessage] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  const [audience, setAudience] = useState<AudienceAnswers>({
    age_groups: [],
    family_status: [],
    employment: [],
    financial_status: [],
  });

  const [finansee, setFinansee] = useState<FinanseeSection>({
    knows: "",
    needed: "",
    analyzes: "",
    receives: "",
    nextStep: "",
  });

  const [titles, setTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [creating, setCreating] = useState(false);

  function goToStep4() {
    const detected = expertise || detectCategory(topic);
    setExpertise(detected);
    if (!finansee.knows && !finansee.nextStep) {
      setFinansee(suggestFinanseeSection(topic, detected));
    }
    setStep(4);
  }

  function goToStep5() {
    if (titles.length === 0) setTitles(generateTitles(topic, 5));
    setStep(5);
  }

  function moreTitles() {
    setTitles((prev) => {
      const fresh = generateTitles(topic, 5, prev);
      return fresh;
    });
    setSelectedTitle("");
  }

  async function handleCreate() {
    setCreating(true);
    const finalMessage = coreMessage === "אחר" ? customMessage : coreMessage;
    const draft = generateDraft({
      topic,
      coreMessage: finalMessage,
      audience,
      finansee,
      title: selectedTitle,
      expertise: expertise || detectCategory(topic),
    });
    try {
      const created = await createHack(draft);
      navigate(`/hacks/${created.id}`, { replace: true });
    } catch (err) {
      console.error(err);
      alert("יצירת הטיוטה נכשלה, נסו שוב.");
      setCreating(false);
    }
  }

  useEffect(() => {
    if (step === 6) handleCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const inputClass =
    "w-full border border-neutral-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-neutral-900";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/hacks")}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          → ביטול וחזרה לרשימה
        </button>
        <span className="text-xs text-neutral-400 ltr-nums">
          שלב {Math.min(step, 5)} מתוך 5 · {STEP_LABELS[Math.min(step, 5) - 1]}
        </span>
      </div>

      <div className="flex gap-1.5 mb-8">
        {STEP_LABELS.slice(0, 5).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-neutral-900" : "bg-neutral-200"}`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm px-6 py-10 md:px-12 md:py-12">
        {step === 1 && (
          <div>
            <p className="text-4xl mb-3">🤖</p>
            <h1 className="text-2xl font-bold text-neutral-900 mb-1">עוזר הכתיבה החכם</h1>
            <p className="text-neutral-500 mb-6">על מה תרצה לכתוב היום?</p>

            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="למשל: דמי ניהול בפנסיה"
              className={inputClass}
              onKeyDown={(e) => e.key === "Enter" && topic.trim() && setStep(2)}
            />

            <div className="flex flex-wrap gap-2 mt-4">
              {TOPIC_EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setTopic(ex)}
                  className="px-3 py-1.5 rounded-full text-xs border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!topic.trim()}
              className="mt-8 w-full py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              המשך
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">מה המסר המרכזי שאתה רוצה להעביר?</h2>
            <p className="text-sm text-neutral-500 mb-6">
              הנושא: <span className="font-medium text-neutral-700">{topic}</span>
            </p>

            <div className="space-y-2">
              {CORE_MESSAGE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setCoreMessage(option)}
                  className={`w-full text-right px-4 py-3 rounded-lg border transition-colors ${
                    coreMessage === option
                      ? "border-neutral-900 bg-neutral-50 font-medium"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {option}
                </button>
              ))}
              <button
                onClick={() => setCoreMessage("אחר")}
                className={`w-full text-right px-4 py-3 rounded-lg border transition-colors ${
                  coreMessage === "אחר"
                    ? "border-neutral-900 bg-neutral-50 font-medium"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                אחר
              </button>
              {coreMessage === "אחר" && (
                <input
                  autoFocus
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="נסחו במילים שלכם..."
                  className={inputClass}
                />
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
              >
                → חזרה
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!coreMessage || (coreMessage === "אחר" && !customMessage.trim())}
                className="flex-1 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">למי מיועד ה-Hack הזה?</h2>
            <p className="text-sm text-neutral-500 mb-6">אפשר לבחור יותר מערך אחד בכל קטגוריה, או לדלג.</p>

            <div className="space-y-5">
              <MultiSelectGroup
                label="גיל"
                options={AGE_GROUPS}
                selected={audience.age_groups}
                onChange={(v) => setAudience((p) => ({ ...p, age_groups: v }))}
              />
              <MultiSelectGroup
                label="מצב משפחתי"
                options={FAMILY_STATUS}
                selected={audience.family_status}
                onChange={(v) => setAudience((p) => ({ ...p, family_status: v }))}
              />
              <MultiSelectGroup
                label="סוג תעסוקה"
                options={EMPLOYMENT}
                selected={audience.employment}
                onChange={(v) => setAudience((p) => ({ ...p, employment: v }))}
              />
              <MultiSelectGroup
                label="מצב כלכלי"
                options={FINANCIAL_STATUS}
                selected={audience.financial_status}
                onChange={(v) => setAudience((p) => ({ ...p, financial_status: v }))}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
              >
                → חזרה
              </button>
              <button
                onClick={goToStep4}
                className="flex-1 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700"
              >
                המשך
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">איך Finansee עוזרת במקרה הזה?</h2>
            <p className="text-sm text-neutral-500 mb-6">
              הצענו תשובה ראשונית לפי הנושא - ערכו אותה כרצונכם.
            </p>

            <div className="mb-6">
              <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase mb-2">
                תחום מקצועי (זוהה אוטומטית, אפשר לשנות)
              </p>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE.map((option) => (
                  <button
                    key={option}
                    onClick={() => setExpertise(option)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      expertise === option
                        ? "bg-neutral-900 text-white border-neutral-900"
                        : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-5 py-6 space-y-5">
              <WritingField
                label={FINANSEE_SECTION_LABELS.knows}
                value={finansee.knows}
                onChange={(v) => setFinansee((p) => ({ ...p, knows: v }))}
                minHeight={55}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.needed}
                value={finansee.needed}
                onChange={(v) => setFinansee((p) => ({ ...p, needed: v }))}
                minHeight={55}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.analyzes}
                value={finansee.analyzes}
                onChange={(v) => setFinansee((p) => ({ ...p, analyzes: v }))}
                minHeight={55}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.receives}
                value={finansee.receives}
                onChange={(v) => setFinansee((p) => ({ ...p, receives: v }))}
                minHeight={55}
              />
              <WritingField
                label={FINANSEE_SECTION_LABELS.nextStep}
                value={finansee.nextStep}
                onChange={(v) => setFinansee((p) => ({ ...p, nextStep: v }))}
                minHeight={45}
              />
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-3 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
              >
                → חזרה
              </button>
              <button
                onClick={goToStep5}
                className="flex-1 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700"
              >
                המשך ליצירת כותרות
              </button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">בחרו כותרת</h2>
            <p className="text-sm text-neutral-500 mb-6">5 הצעות לפי הנושא והמסר שבחרתם.</p>

            <div className="space-y-2">
              {titles.map((title) => (
                <button
                  key={title}
                  onClick={() => setSelectedTitle(title)}
                  className={`w-full text-right px-4 py-3 rounded-lg border transition-colors ${
                    selectedTitle === title
                      ? "border-neutral-900 bg-neutral-50 font-medium"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {title}
                </button>
              ))}
            </div>

            <button
              onClick={moreTitles}
              className="mt-3 text-sm text-neutral-500 hover:text-neutral-900 underline"
            >
              צור עוד 5 הצעות
            </button>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(4)}
                className="px-5 py-3 rounded-lg border border-neutral-300 text-sm font-medium hover:bg-neutral-50"
              >
                → חזרה
              </button>
              <button
                onClick={() => setStep(6)}
                disabled={!selectedTitle}
                className="flex-1 py-3 rounded-lg bg-neutral-900 text-white font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                צרו את הטיוטה
              </button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-4 animate-pulse">✨</p>
            <p className="text-neutral-600">
              {creating ? "כותב טיוטה ראשונה..." : "כמעט מוכן..."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
