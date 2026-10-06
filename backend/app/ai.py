"""Real AI draft generation via the Anthropic API.

This is separate from lib/draftAssistant.ts on the frontend, which is a
deterministic, template-based fallback used when no backend AI call is
wired into the UI yet. This module is the actual model-backed path:
call generate_draft(...) to get a complete Hack draft from Claude.
"""

import json
import os
import re

from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Overridable via backend/.env (ANTHROPIC_MODEL=...) so a model change
# doesn't require a code change.
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")

REQUIRED_FIELDS = [
    "title",
    "subtitle",
    "hook",
    "why_it_matters",
    "problem",
    "example_story",
    "content",
    "action_steps",
    "cautions",
    "bottom_line",
    "cta",
]

# Keys and labels mirror FINANSEE_SECTION_LABELS in frontend/src/lib/finansee.ts.
FINANSEE_SECTION_LABELS = {
    "knows": "מה Finansee כבר יודעת",
    "needed": "מה עוד נדרש ממך",
    "analyzes": "מה Finansee תבדוק עבורך",
    "receives": "מה תקבלו",
    "nextStep": "הצעד הבא",
}

# Must match FINANSEE_SECTION_LABELS in frontend/src/lib/finansee.ts exactly -
# the frontend parses `cta` by these literal "## <label>" headers.
SYSTEM_PROMPT = """את/ה עורך/ת תוכן פיננסי מקצועי/ת ב-Finansee, פלטפורמה שמלווה \
משתמשים בניהול הכספים שלהם. את/ה כותב/ת "Hacks" - כתבות פיננסיות קצרות \
ומעשיות בעברית, בסגנון עיתונאי, נגיש ומקצועי, ללא ז'רגון מיותר, ללא הבטחות \
לתשואה או חיסכון ודאי, וללא קליקבייט. כשההשפעה תלויה בנתונים אישיים, השתמשו \
בניסוחים מסויגים כמו "עשוי", "יכול", "במקרים מסוימים". דוגמאות חיים הן תמיד \
היפותטיות בלבד ולעולם לא מוצגות כמקרה אמיתי.

בכל בקשה תקבל/י נושא, מסר מרכזי, תחום מקצועי וקהל יעד. עליך להחזיר טיוטה \
מלאה של Hack.

חשוב מאוד: החזר/י אך ורק אובייקט JSON תקין - בלי טקסט לפני או אחרי, בלי \
markdown, בלי גדר קוד (```), רק ה-JSON עצמו. האובייקט חייב לכלול בדיוק את \
11 השדות הבאים, כולם מחרוזות טקסט (action_steps הוא מערך של מחרוזות):

- title: כותרת קצרה ומושכת
- subtitle: כותרת משנה - משפט או שניים שמסבירים למה זה חשוב
- hook: פתיח של כמה משפטים שמכניס את הקורא לנושא
- why_it_matters: 2-5 משפטים שמסבירים לקורא למה כדאי להקדיש לזה תשומת לב
- problem: מה אנשים עושים היום, מה הם לא יודעים, מה עלול להשתבש
- example_story: דוגמה היפותטית קצרה (לא מקרה אמיתי)
- content: ההסבר המקצועי המרכזי - 2-3 פסקאות, עם \\n\\n בין פסקאות
- action_steps: מערך של 3-5 צעדים מעשיים וקונקרטיים (מחרוזות בודדות, לא מספרים בתחילת המחרוזת)
- cautions: מתי ההאק לא מתאים, מתי נדרש ייעוץ מקצועי
- bottom_line: משפט או שניים שמסכמים את המסר המרכזי
- cta: ראה/י פירוט מיוחד למטה

שדה ה-cta הוא מיוחד: הוא חייב להיות בפורמט מובנה עם 5 חלקים בדיוק, בסדר \
הזה, כל חלק מתחיל בשורה משלו בפורמט "## <תווית>" ואחריה השורה/שורות עם \
התוכן, ושתי שורות ריקות בין חלקים. השתמש/י בדיוק בתוויות האלה, מילה במילה:

## מה Finansee כבר יודעת
<איזה מידע כבר קיים בפרופיל הלקוח ב-Finansee הרלוונטי לנושא>

## מה עוד נדרש ממך
<איזה מידע חסר וצריך לבקש מהלקוח>

## מה Finansee תבדוק עבורך
<מה בדיוק המערכת מנתחת או משווה>

## מה תקבלו
<מה הלקוח מקבל בסוף - ניתוח אישי, דוח מותאם וכו'>

## הצעד הבא
<פעולה קונקרטית אחת בתוך Finansee, למשל "בדקו את X ב-Finansee" - לעולם לא \
עצה כללית כמו "לכו לבדוק" או "דברו עם מישהו">
"""


class DraftGenerationError(Exception):
    """Raised when the model's response can't be parsed into a valid draft."""


_client: Anthropic | None = None


def get_client() -> Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise DraftGenerationError(
                "ANTHROPIC_API_KEY חסר - ודא/י שהוא מוגדר בקובץ backend/.env"
            )
        _client = Anthropic(api_key=api_key)
    return _client


def generate_draft(
    topic: str,
    core_message: str,
    audience: dict,
    expertise: str,
    title: str = "",
    finansee_section: dict | None = None,
) -> dict:
    """Calls Claude to generate a full Hack draft. Raises DraftGenerationError
    on any API or parsing failure, with a message safe to show in the UI.

    `title` and `finansee_section` are the editor's own choices from the
    wizard: they are given to the model as context, and then enforced on the
    result so the editor's wording always wins over the model's."""
    title = (title or "").strip()
    editor_section = {
        key: (finansee_section or {}).get(key, "").strip() for key in FINANSEE_SECTION_LABELS
    }

    user_prompt = (
        f"נושא: {topic}\n"
        f"מסר מרכזי: {core_message}\n"
        f"תחום מקצועי: {expertise}\n"
        f"קהל יעד: {json.dumps(audience, ensure_ascii=False)}\n"
    )
    if title:
        user_prompt += (
            f"\nכותרת שנבחרה על ידי העורך (חובה להשתמש בה מילה במילה בשדה title, "
            f"ולכתוב את שאר הכתבה כך שתתאים לה): {title}\n"
        )
    if any(editor_section.values()):
        user_prompt += (
            "\nהעורך כבר כתב חלקים מהפרק \"איך Finansee עוזרת\". בשדה cta יש להעתיק "
            "חלקים אלה מילה במילה, ולהשלים רק את החלקים שמסומנים כ\"(להשלמה)\". "
            "שאר הכתבה צריכה להיות עקבית איתם:\n\n"
            + "\n\n".join(
                f"## {label}\n{editor_section[key] or '(להשלמה)'}"
                for key, label in FINANSEE_SECTION_LABELS.items()
            )
            + "\n"
        )
    user_prompt += "\nכתבו טיוטה מלאה של Hack פיננסי על הנושא הזה, לפי ההנחיות במערכת."

    client = get_client()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as-is
        raise DraftGenerationError(f"קריאה ל-Claude נכשלה: {exc}") from exc

    raw_text = "".join(block.text for block in response.content if block.type == "text")

    try:
        data = _parse_json_response(raw_text)
    except (ValueError, json.JSONDecodeError) as exc:
        raise DraftGenerationError(
            f"לא ניתן היה לפענח את תשובת המודל כ-JSON תקין: {exc}\n\nתשובת המודל:\n{raw_text}"
        ) from exc

    missing = [field for field in REQUIRED_FIELDS if field not in data]
    if missing:
        raise DraftGenerationError(f"בתשובת המודל חסרים השדות: {', '.join(missing)}")

    if not isinstance(data["action_steps"], list):
        raise DraftGenerationError("השדה action_steps חייב להיות מערך של מחרוזות")

    draft = {field: data[field] for field in REQUIRED_FIELDS}

    # Enforce the editor's choices regardless of what the model returned.
    if title:
        draft["title"] = title
    if any(editor_section.values()):
        model_section = _parse_finansee_section(str(draft.get("cta", "")))
        merged = {key: editor_section[key] or model_section.get(key, "") for key in FINANSEE_SECTION_LABELS}
        draft["cta"] = _serialize_finansee_section(merged)

    return draft


def _parse_finansee_section(text: str) -> dict:
    """Python twin of parseFinanseeSection in frontend/src/lib/finansee.ts."""
    label_to_key = {label: key for key, label in FINANSEE_SECTION_LABELS.items()}
    result = {key: "" for key in FINANSEE_SECTION_LABELS}
    current, buffer = None, []
    for line in text.split("\n"):
        match = re.match(r"^##\s+(.+)$", line)
        key = label_to_key.get(match.group(1).strip()) if match else None
        if key:
            if current:
                result[current] = "\n".join(buffer).strip()
            current, buffer = key, []
        else:
            buffer.append(line)
    if current:
        result[current] = "\n".join(buffer).strip()
    return result


def _serialize_finansee_section(section: dict) -> str:
    """Python twin of serializeFinanseeSection in frontend/src/lib/finansee.ts."""
    return "\n\n".join(
        f"## {label}\n{section.get(key, '').strip()}" for key, label in FINANSEE_SECTION_LABELS.items()
    )


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("תשובת המודל אינה אובייקט JSON")
    return parsed
