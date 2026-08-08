import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getHack } from "../lib/api";
import type { Hack } from "../types";
import { STATUS_LABELS } from "../constants";
import { categoryLabel } from "../lib/hackDisplay";
import { FINANSEE_SECTION_LABELS, isFinanseeSectionEmpty, parseFinanseeSection } from "../lib/finansee";

function Section({ heading, children }: { heading?: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      {heading && (
        <h2 className="text-sm font-semibold tracking-wide text-neutral-500 mb-3">{heading}</h2>
      )}
      {children}
    </section>
  );
}

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

  const sourceLines = hack.sources
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const finansee = parseFinanseeSection(hack.cta);
  const hasFinanseeSection = !isFinanseeSectionEmpty(finansee);
  const isLegacyCta = !hasFinanseeSection && hack.cta.trim().length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 max-w-[680px] mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm text-neutral-500 hover:text-neutral-900">
          → חזרה לעריכה
        </button>
        <Link
          to={`/hacks/${hack.id}`}
          className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium hover:bg-neutral-50"
        >
          עריכה
        </Link>
      </div>

      <article className="max-w-[680px] mx-auto bg-white rounded-2xl px-6 py-10 md:px-14 md:py-14">
        <div className="flex items-center gap-2 mb-4 text-xs text-neutral-400">
          <span>{categoryLabel(hack)}</span>
          <span>·</span>
          <span>{STATUS_LABELS[hack.status]}</span>
        </div>

        <h1 className="text-3xl md:text-[2.25rem] font-bold text-neutral-900 leading-tight mb-4">
          {hack.title || "(ללא כותרת)"}
        </h1>

        {hack.subtitle && (
          <p className="text-xl text-neutral-500 leading-snug mb-8">{hack.subtitle}</p>
        )}

        {hack.hook && (
          <p className="text-lg text-neutral-800 leading-relaxed font-medium">{hack.hook}</p>
        )}

        {hack.why_it_matters && (
          <Section heading="למה זה חשוב">
            <p className="text-[17px] text-neutral-700 leading-[1.9] whitespace-pre-wrap">
              {hack.why_it_matters}
            </p>
          </Section>
        )}

        {hack.problem && (
          <Section heading="הבעיה">
            <p className="text-[17px] text-neutral-700 leading-[1.9] whitespace-pre-wrap">
              {hack.problem}
            </p>
          </Section>
        )}

        {hack.example_story && (
          <Section heading="דוגמה מהחיים">
            <p className="text-[17px] text-neutral-700 leading-[1.9] whitespace-pre-wrap">
              {hack.example_story}
            </p>
          </Section>
        )}

        {hack.content && (
          <Section>
            <p className="text-[17px] text-neutral-700 leading-[1.9] whitespace-pre-wrap">
              {hack.content}
            </p>
          </Section>
        )}

        {hack.action_steps.length > 0 && (
          <Section heading="מה עושים בפועל">
            <ol className="space-y-3">
              {hack.action_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-[17px] text-neutral-700 leading-[1.8]">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-neutral-100 text-neutral-500 text-sm font-medium flex items-center justify-center ltr-nums">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {hack.cautions && (
          <Section heading="דברים שכדאי לדעת">
            <p className="text-[17px] text-neutral-700 leading-[1.9] whitespace-pre-wrap">
              {hack.cautions}
            </p>
          </Section>
        )}

        {hack.bottom_line && (
          <div className="mt-9 bg-amber-50 border-r-4 border-amber-400 rounded-lg px-5 py-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">בשורה התחתונה</p>
            <p className="text-[15px] text-neutral-800 leading-relaxed">{hack.bottom_line}</p>
          </div>
        )}

        {hasFinanseeSection && (
          <div className="mt-8 bg-blue-50/70 border border-blue-100 rounded-xl px-6 py-7 md:px-8">
            <h2 className="text-lg font-bold text-blue-950 mb-1.5">איך Finansee עוזרת לך</h2>
            <p className="text-sm text-blue-800/80 leading-relaxed mb-5">
              Finansee כבר מכירה חלק מהפרופיל הפיננסי שלך - ולכן אתם לא מתחילים מאפס. המערכת
              משלימה רק את המידע החסר ומצרפת אותו למה שכבר ידוע עליך.
            </p>

            <div className="space-y-4">
              {finansee.knows && (
                <div className="flex gap-2.5">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <p className="text-[15px] text-blue-950 leading-relaxed">
                    <span className="font-semibold">{FINANSEE_SECTION_LABELS.knows}: </span>
                    {finansee.knows}
                  </p>
                </div>
              )}
              {finansee.needed && (
                <div className="flex gap-2.5">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <p className="text-[15px] text-blue-950 leading-relaxed">
                    <span className="font-semibold">{FINANSEE_SECTION_LABELS.needed}: </span>
                    {finansee.needed}
                  </p>
                </div>
              )}
              {finansee.analyzes && (
                <div className="flex gap-2.5">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <p className="text-[15px] text-blue-950 leading-relaxed">
                    <span className="font-semibold">{FINANSEE_SECTION_LABELS.analyzes}: </span>
                    {finansee.analyzes}
                  </p>
                </div>
              )}
              {finansee.receives && (
                <div className="flex gap-2.5">
                  <span className="text-blue-500 shrink-0">✓</span>
                  <p className="text-[15px] text-blue-950 leading-relaxed">
                    <span className="font-semibold">{FINANSEE_SECTION_LABELS.receives}: </span>
                    {finansee.receives}
                  </p>
                </div>
              )}
            </div>

            {finansee.nextStep && (
              <div className="mt-6 bg-blue-900 text-white rounded-lg px-5 py-4 flex items-center gap-2">
                <span aria-hidden>←</span>
                <span className="font-medium">{finansee.nextStep}</span>
              </div>
            )}
          </div>
        )}

        {isLegacyCta && (
          <div className="mt-6 flex items-center gap-2 text-[15px] text-neutral-800 bg-neutral-50 rounded-lg px-5 py-4">
            <span aria-hidden>→</span>
            <span>{hack.cta}</span>
          </div>
        )}

        {sourceLines.length > 0 && (
          <Section heading="מקורות">
            <ul className="space-y-1">
              {sourceLines.map((line, i) => (
                <li key={i} className="text-sm text-neutral-500">
                  {line}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
    </div>
  );
}
