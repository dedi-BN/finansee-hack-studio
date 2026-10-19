import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getHack } from "../lib/api";
import type { Hack } from "../types";
import StatusBadge from "../components/StatusBadge";
import { ACCENT_CLASS, HERO_GRADIENT, domainTone } from "../lib/domainTone";
import { categoryLabel } from "../lib/hackDisplay";
import { FINANSEE_SECTION_LABELS, isFinanseeSectionEmpty, parseFinanseeSection } from "../lib/finansee";

function Section({ heading, accent, children }: { heading?: string; accent: string; children: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-white border border-neutral-200 rounded-xl shadow-md px-6 pt-7 pb-6">
      <div className={`absolute top-0 inset-x-0 h-[3px] ${accent}`} aria-hidden />
      {heading && <h2 className="text-xl font-extrabold text-neutral-900 mb-3">{heading}</h2>}
      {children}
    </section>
  );
}

// The amount at the end of the example story ("כ-3,500 ש"ח"), shown as the
// story's result. Returns null when the story names no amount.
function storyAmount(story: string): string | null {
  const sentences = story.trim().split(/(?<=[.!?])\s+/);
  const last = sentences[sentences.length - 1] ?? "";
  if (/תוספת|עלות|שילמ|לשלם|פרמיה/.test(last)) return null;
  const match = last.match(/(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?:ש["״'׳]?ח|₪)|₪\s*(\d{1,3}(?:,\d{3})+|\d{3,})/);
  const digits = match?.[1] ?? match?.[2];
  return digits ? `₪${digits}` : null;
}

const BODY = "text-[17px] font-medium text-neutral-700 leading-[1.85] whitespace-pre-wrap";

export default function Preview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hack, setHack] = useState<Hack | null>(null);

  useEffect(() => {
    getHack(Number(id)).then(setHack).catch(console.error);
  }, [id]);

  if (!hack) {
    return <p className="text-center text-neutral-400 py-10 text-sm">טוען...</p>;
  }

  const finansee = parseFinanseeSection(hack.cta);
  const hasFinanseeSection = !isFinanseeSectionEmpty(finansee);
  const isLegacyCta = !hasFinanseeSection && hack.cta.trim().length > 0;

  const domain = categoryLabel(hack);
  const tone = domainTone(domain);
  const accent = ACCENT_CLASS[tone];
  const amount = hack.example_story ? storyAmount(hack.example_story) : null;
  const finanseeRows = (["knows", "needed", "analyzes", "receives"] as const).filter((key) => finansee[key]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 max-w-[760px] mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="min-h-11 inline-flex items-center gap-1.5 text-sm font-bold text-neutral-600 hover:text-neutral-900"
        >
          <span aria-hidden>→</span> חזרה
        </button>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={hack.status} />
          <Link
            to={`/hacks/${hack.id}`}
            className="min-h-11 inline-flex items-center px-5 rounded-full border border-neutral-200 bg-white text-sm font-bold hover:bg-neutral-50"
          >
            עריכה
          </Link>
        </div>
      </div>

      <article className="max-w-[760px] mx-auto flex flex-col gap-5">
        <header
          className="rounded-2xl px-7 py-9 md:px-9 text-white shadow-lg flex flex-col gap-4"
          style={{ background: HERO_GRADIENT[tone] }}
        >
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/30">{domain}</span>
            <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/30 ltr-nums">#{hack.number}</span>
          </div>
          <h1 className="text-3xl md:text-[2.25rem] font-extrabold tracking-tight leading-tight">
            {hack.title || "(ללא כותרת)"}
          </h1>
          {hack.subtitle && <p className="text-lg font-medium leading-relaxed text-white/85">{hack.subtitle}</p>}
        </header>

        {hack.hook && (
          <p className="text-lg font-medium text-neutral-800 leading-[1.8] px-1 pt-2">{hack.hook}</p>
        )}

        {hack.why_it_matters && (
          <Section heading="למה זה חשוב" accent={accent}>
            <p className={BODY}>{hack.why_it_matters}</p>
          </Section>
        )}

        {hack.problem && (
          <Section heading="הבעיה" accent={accent}>
            <p className={BODY}>{hack.problem}</p>
          </Section>
        )}

        {hack.example_story && (
          <section className="bg-white border border-neutral-200 rounded-xl shadow-md overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <h2 className="text-xl font-extrabold">דוגמה מהחיים</h2>
              <p className="text-xs font-semibold text-neutral-500 mt-0.5 mb-3">דוגמה להמחשה</p>
              <p className={BODY}>{hack.example_story}</p>
            </div>
            {amount && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-fin-green-soft border-t border-[hsl(150_50%_82%)]">
                <span className="text-[15px] font-bold text-fin-green">התוצאה בדוגמה</span>
                <span className="text-4xl font-extrabold tracking-tight leading-none text-fin-green ltr-nums">{amount}</span>
              </div>
            )}
          </section>
        )}

        {hack.content && <p className={`${BODY} px-1 py-2`}>{hack.content}</p>}

        {hack.action_steps.length > 0 && (
          <Section heading="מה עושים בפועל" accent={accent}>
            <ol className="flex flex-col gap-3.5">
              {hack.action_steps.map((step, i) => (
                <li key={i} className="flex gap-3.5 items-start">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white text-sm font-extrabold flex items-center justify-center ltr-nums">
                    {i + 1}
                  </span>
                  <span className="text-base font-semibold text-neutral-800 leading-relaxed pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {hack.cautions && (
          <section className="rounded-xl px-6 py-5 bg-fin-amber-soft border border-[hsl(45_70%_85%)]">
            <h2 className="text-lg font-extrabold text-fin-amber-ink mb-2">דברים שכדאי לדעת</h2>
            <p className="text-[15px] font-medium leading-[1.8] text-[hsl(35_45%_20%)] whitespace-pre-wrap">{hack.cautions}</p>
          </section>
        )}

        {hack.bottom_line && (
          <section className="px-1 py-3">
            <p className="text-sm font-bold text-neutral-500 mb-1.5">בשורה התחתונה</p>
            <p className="text-2xl font-extrabold tracking-tight leading-snug">{hack.bottom_line}</p>
          </section>
        )}

        {hasFinanseeSection && (
          <section className="rounded-2xl px-6 py-7 md:px-8 bg-white border border-neutral-200 shadow-[0_8px_24px_hsla(250,30%,25%,0.08),0_1px_3px_hsla(250,30%,25%,0.04)] flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="fin-ring w-11 h-11 rounded-full p-[3px] shrink-0" aria-hidden>
                <span className="block w-full h-full rounded-full bg-white" />
              </span>
              <h2 className="text-[1.375rem] font-extrabold">איך Finansee עוזרת לך</h2>
            </div>
            <p className="text-[15px] font-medium text-neutral-500 leading-relaxed">
              Finansee כבר מכירה חלק מהפרופיל הפיננסי שלך - ולכן אתם לא מתחילים מאפס. המערכת
              משלימה רק את המידע החסר ומצרפת אותו למה שכבר ידוע עליך.
            </p>
            {finanseeRows.map((key) => (
              <div key={key} className="flex gap-3.5 items-start p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                <span className="shrink-0 w-8 h-8 rounded-full bg-fin-violet-soft text-fin-violet flex items-center justify-center" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="text-[15px] font-medium leading-relaxed text-neutral-700">
                  <span className="block font-extrabold text-neutral-900 mb-0.5">{FINANSEE_SECTION_LABELS[key]}</span>
                  {finansee[key]}
                </p>
              </div>
            ))}
            {finansee.nextStep && (
              <div className="btn-primary mt-1 rounded-full min-h-13 px-6 py-3.5 flex items-center justify-center gap-2 text-base font-bold text-center">
                <span>{finansee.nextStep}</span>
                <span aria-hidden>←</span>
              </div>
            )}
          </section>
        )}

        {isLegacyCta && (
          <div className="flex items-center gap-2 text-[15px] text-neutral-800 bg-white border border-neutral-200 rounded-xl px-5 py-4">
            <span aria-hidden>←</span>
            <span>{hack.cta}</span>
          </div>
        )}
      </article>
    </div>
  );
}
