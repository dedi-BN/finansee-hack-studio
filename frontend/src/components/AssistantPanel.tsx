import { useState } from "react";
import { EDITORIAL_TIPS } from "../lib/draftAssistant";
import type { HackInput } from "../types";
import Card from "./Card";

export default function AssistantPanel({ hack }: { hack: HackInput }) {
  const [activeTip, setActiveTip] = useState<string | null>(null);

  return (
    <Card title="🤖 עוזר AI">
      <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
        בדיקות עריכה מהירות על הטיוטה הנוכחית. לחצו על נושא לקבלת משוב.
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {EDITORIAL_TIPS.map((tip) => (
          <button
            key={tip.id}
            onClick={() => setActiveTip(tip.id)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
              activeTip === tip.id
                ? "bg-neutral-900 text-white border-neutral-900"
                : "bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400"
            }`}
          >
            {tip.label}
          </button>
        ))}
      </div>
      {activeTip && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-700 leading-relaxed">
          {EDITORIAL_TIPS.find((t) => t.id === activeTip)?.evaluate(hack)}
        </div>
      )}
    </Card>
  );
}
