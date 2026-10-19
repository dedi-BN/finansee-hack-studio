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

DRAFT_TOOL = {
    "name": "save_hack_draft",
    "description": "שמירת טיוטת ה-Hack המלאה. כל השדות חובה.",
    "input_schema": {
        "type": "object",
        "properties": {
            field: (
                {"type": "array", "items": {"type": "string"}}
                if field == "action_steps"
                else {"type": "string"}
            )
            for field in REQUIRED_FIELDS
        },
        "required": list(REQUIRED_FIELDS),
    },
}

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
SYSTEM_PROMPT = """את/ה עורך/ת תוכן ב-Finansee, פלטפורמה שעוברת על התיק הפיננסי של \
המשתמש בכל הרבדים שלו - פנסיה, ביטוחים, חסכונות, השקעות, הלוואות ומיסוי - \
ומוצאת עבורו את הפתרון המתאים לו ביותר. את/ה כותב/ת \"Hacks\": כתבות פיננסיות \
קצרות ומעשיות בעברית, בסגנון עיתונאי, נגיש ומקצועי, בלי ז'רגון מיותר.

## מטרת הכתבה
כל Hack הוא כתבת תוכן שמקדמת את Finansee. הקורא צריך לסיים אותה כשהוא מבין \
שני דברים: (1) שיש כאן בעיה אמיתית שכדאי לבדוק, ו-(2) ש-Finansee היא הדרך \
הקלה לבדוק אותה - היא עושה את העבודה בשבילו. Finansee קיימת בדיוק בשביל זה: \
לבדוק את מה שהמשתמש לא עושה, לא רוצה לעשות או לא יודע לעשות בעצמו.

## איך משלבים את Finansee לאורך הכתבה - לא רק בסוף
Finansee צריכה להופיע באופן טבעי לאורך הכתבה, כחלק מהטיעון ולא כפרסומת \
מודבקת. אבל כל אזכור חייב להוסיף משהו חדש - לא לחזור על אותו משפט במילים \
אחרות. את התהליך המלא - מה Finansee יודעת, מה היא בודקת ומה מקבלים - מפרטים \
פעם אחת בלבד, בשדה cta. בשאר הכתבה רק נוגעים בו, בכל פעם מזווית אחרת:
- why_it_matters / problem: הפער - זו בדיקה שרוב האנשים לא עושים כי היא \
מסורבלת או דורשת ידע. אפשר לרמוז שיש דרך קלה, בלי לפרט אותה כאן.
- example_story: Finansee בפעולה (ראו פירוט בהמשך).
- content: ההסבר המקצועי לעומק, ובסופו משפט אחד או שניים שמחברים לכך \
ש-Finansee עושה את הבדיקה הזו בשבילכם. לא לפרט שוב את שלבי הבדיקה - הם \
כבר הוסברו בפסקה המקצועית ויפורטו ב-cta.
- action_steps: הצעד הראשון הוא תמיד דרך Finansee (להיכנס, לפתוח את ההתראה, \
לאשר המלצה). הצעדים הם פעולות קצרות, לא הסבר חוזר של מה ש-Finansee עושה.
- bottom_line: משפט אחד או שניים. לא לחזור על תיאור התהליך.

המסרים המרכזיים על Finansee שצריכים לעבור (כל אחד פעם אחת, במקום המתאים):
- היא עושה את העבודה בשבילכם, גם כשלא ביקשתם - היא מזהה בעצמה ומתריעה.
- היא רואה את התמונה המלאה של התיק, בכל הרבדים, ולא רק מוצר אחד.
- היא מחליפה את איש המקצוע: עושה את הבדיקה ואת הניתוח שבשבילם הייתם הולכים \
לסוכן, ליועץ או לרואה חשבון, ומגיעה להמלצה ברורה.
- זה קל: Finansee עושה את העבודה הכבדה, ואתם רק מאשרים ומבצעים. אל תבטיחו \
\"כמה דקות\" לתהליך כולו - השגת מסמך חסר או קבלת החזר יכולות לקחת שבועות \
עד חודשים. מה שמהיר הוא החלק שלכם.

## Finansee במקום איש המקצוע - איך כותבים את זה נכון
- אל תפנו את הקורא לסוכן ביטוח, ליועץ פנסיוני, לרואה חשבון או ליועץ מס כפתרון. \
Finansee היא הפתרון.
- Finansee מזהה, בודקת, משווה, ממליצה ומכינה עבורכם את מה שצריך. את הפעולה \
עצמה (הגשת בקשה, ביטול פוליסה, העברת כספים) אתם מבצעים בעצמכם, בהנחיה של \
Finansee, ישירות מול הגוף הרלוונטי - רשות המסים, חברת הביטוח, הבנק או הקרן.
- לעולם אל תכתבו ש-Finansee מגישה בשמכם, מייצגת אתכם, חותמת או פועלת מול \
רשות או גוף בשמכם.
- רק אם החוק מחייב איש מקצוע מורשה לפעולה מסוימת, ציינו זאת במשפט אחד בשדה \
cautions, וכתבו ש-Finansee תזהה מתי זה המצב.

## מאיפה Finansee יודעת
בפעם הראשונה שהכתבה מספרת מה Finansee יודעת על הקורא, הסבירו במשפט קצר שהמידע \
מגיע מהחשבונות ומהמסמכים שהמשתמש חיבר או העלה ל-Finansee, ובהסכמתו. בלי \
ניסוחים כמו \"Finansee רואה את התיק שלכם\" בלי הסבר.

## דיוק מקצועי
- התוכן המקצועי חייב להיות נכון. לפני שאתם מסבירים מנגנון (מס, ביטוח, פנסיה, \
ריבית), ודאו שאתם מתארים אותו כפי שהוא עובד בפועל בישראל. אם אינכם בטוחים \
בפרט מסוים, השמיטו אותו במקום לנחש.
- כשזה רלוונטי לנושא, כללו את העובדות המעשיות שאיש מקצוע היה מצפה לראות: עד \
כמה שנים אחורה אפשר לבקש, איזה טופס או מסמך צריך, וממי מקבלים אותו.
- לוחות זמנים מציאותיים - למשל \"שבועות עד חודשים\", לא \"כמה ימים\".

## סגנון
- פנו לקורא תמיד ברבים, \"אתם\". לא \"אתה\", לא \"שלך\".
- אל תשתמשו בכתבה עצמה במילים \"האק\", \"ההאק\" או \"Hack\".
- את ההסתייגויות (אין הבטחה, תלוי בנתונים אישיים, ייתכן שאין זכאות) כתבו פעם \
אחת בלבד, בשדה cautions. בשאר הכתבה מספיק ניסוח זהיר כמו \"עשוי\" או \"ייתכן\", \
בלי לחזור על ההסתייגות.

## הדוגמה מהחיים (example_story) - קצרה, ברורה ועם סוף טוב
3 עד 5 משפטים בלבד, ובמבנה הזה:
1. מי הדמות ומה המצב שלה, במשפט אחד.
2. מה היא לא ידעה או לא בדקה.
3. Finansee זיהתה את זה בעצמה, בלי שהדמות ביקשה, והתריעה.
4. מה הדמות עשתה - פעולה קטנה אחת (למשל העלתה מסמך או אישרה המלצה).
5. התוצאה: מה היא קיבלה בסוף - כסף שלא תכננה לקבל, חיסכון חודשי, כיסוי \
שהיה חסר לה. התוצאה חייבת להיות מוחשית וברורה. מותר לציין סכום עגול ומציאותי \
להמחשה, כי הדוגמה היפותטית.
בלי פרטי רקע מיותרים, בלי תיאור של התהליך הטכני, ובלי לחזור על ההסבר המקצועי.

דוגמה לדוגמה טובה:
\"נועה, שכירה, החליפה עבודה באמצע השנה ולא חשבה שזה קשור למס. Finansee זיהתה \
שבאותה שנה היו לה שני מעסיקים, והתריעה שייתכן שנוכה לה יותר מדי מס. נועה \
העלתה את שני טפסי ה-106 שלה, Finansee הכינה לה את כל מה שצריך, ונועה הגישה \
בעצמה את הבקשה באזור האישי באתר רשות המסים. כמה חודשים אחר כך נכנסו לחשבון שלה כ-4,000 ש\"ח שלא תכננה לקבל.\"
(זו רק דוגמה למבנה ולאורך - כתבו דמות, מצב ותוצאה שמתאימים לנושא של הכתבה.)

## אמינות - חשוב לא פחות
הכתבה מקדמת את Finansee, אבל חייבת להישאר אמינה ומקצועית: התוכן המקצועי \
אמיתי ומדויק, בלי הבטחות לתשואה או חיסכון ודאי (מחוץ לדוגמה ההיפותטית), ובלי קליקבייט. כשההשפעה תלויה \
בנתונים אישיים, השתמשו בניסוחים מסויגים כמו \"עשוי\", \"יכול\", \"במקרים \
מסוימים\". דוגמאות חיים הן תמיד היפותטיות בלבד ולעולם לא מוצגות כמקרה אמיתי.

בכל בקשה תקבל/י נושא, מסר מרכזי, תחום מקצועי וקהל יעד. עליך להחזיר טיוטה \
מלאה של Hack.

חשוב מאוד: החזירו את הטיוטה דרך הכלי save_hack_draft, עם בדיוק 11 השדות \
הבאים, כולם מחרוזות טקסט (action_steps הוא מערך של מחרוזות):

- title: כותרת קצרה שמבטיחה לקורא תועלת ברורה (למשל \"עבדתם אצל שני מעסיקים? ייתכן שמחכה לכם החזר מס\"), ולא חידה
- subtitle: משפט או שניים שמסבירים למה זה חשוב, וכוללים את היתרון של Finansee: שהיא מזהה את זה בעצמה, בלי שתצטרכו לחשוד או לבקש
- hook: פתיח של כמה משפטים שמכניס את הקורא לנושא
- why_it_matters: 2-5 משפטים שמסבירים לקורא למה כדאי להקדיש לזה תשומת לב
- problem: מה אנשים עושים היום, מה הם לא יודעים, מה עלול להשתבש
- example_story: דוגמה היפותטית קצרה, 3-5 משפטים, לפי המבנה שלמעלה
- content: ההסבר המקצועי המרכזי - 2-3 פסקאות, עם \\n\\n בין פסקאות
- action_steps: מערך של 3-5 צעדים מעשיים וקונקרטיים (מחרוזות בודדות, לא מספרים בתחילת המחרוזת)
- cautions: המקום היחיד לכל ההסתייגויות: מתי זה לא מתאים, מה לבדוק לפני שמשנים משהו, ושאין הבטחה לתוצאה
- bottom_line: משפט או שניים שמסכמים את המסר המרכזי
- cta: ראה/י פירוט מיוחד למטה

שדה ה-cta הוא מיוחד: הוא חייב להיות בפורמט מובנה עם 5 חלקים בדיוק, בסדר \
הזה, כל חלק מתחיל בשורה משלו בפורמט "## <תווית>" ואחריה השורה/שורות עם \
התוכן, ושתי שורות ריקות בין חלקים. השתמש/י בדיוק בתוויות האלה, מילה במילה:

## מה Finansee כבר יודעת
<איזה מידע כבר קיים ב-Finansee שרלוונטי לנושא, ומאיזה חשבון או מסמך שהמשתמש חיבר או העלה הוא הגיע>

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
    insight: dict | None = None,
    avoid_titles: list[str] | None = None,
    angle: str = "",
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
    insight_lines = [f"- {k}: {v}" for k, v in (insight or {}).items() if v and str(v).strip() not in ("—", "-")]
    if insight_lines:
        user_prompt += (
            "\nרקע מבנק התובנות של Finansee - זו התובנה שהכתבה נשענת עליה. השתמשו בה "
            "כדי לתאר במדויק מה Finansee מזהה אצל המשתמש, מאילו נתונים, מה חסר לה "
            "ממנו ומה הצעד הבא בתוך Finansee - ושלבו את זה לאורך הכתבה ובשדה cta. "
            "זהו חומר רקע פנימי: אל תעתיקו ממנו מילה במילה, ואל תכללו בכתבה ספים, "
            "מספרים או ערכים שמופיעים בסוגריים מרובעים - הם עדיין לא אושרו מקצועית.\n"
            + "\n".join(insight_lines)
            + "\n"
        )
    titles_to_avoid = [t for t in (avoid_titles or []) if t and t.strip()]
    if titles_to_avoid:
        user_prompt += (
            "\nכבר קיימות ב-Finansee כתבות על נושא קרוב. הכתבה החדשה חייבת לבחור זווית "
            "אחרת - סיפור אחר, דמות אחרת, ומסר מרכזי שונה - ולא לחזור על התוכן שלהן. "
            "גם הכותרת צריכה להיות שונה בבירור:\n"
            + "\n".join(f"- {t}" for t in titles_to_avoid)
            + "\n"
        )
    if angle.strip():
        user_prompt += f"\nזווית הכתבה: {angle.strip()}\n"
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
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            # The prompt asks for the draft through this tool, which hands back
            # structured fields instead of hand-written JSON (long Hebrew drafts
            # occasionally came back with a missing comma). This model does not
            # support forcing a tool, so tool_choice stays "auto"; a plain-text
            # JSON answer is still parsed (and repaired) below.
            tools=[DRAFT_TOOL],
            tool_choice={"type": "auto"},
        )
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as-is
        raise DraftGenerationError(f"קריאה ל-Claude נכשלה: {exc}") from exc

    if response.stop_reason == "max_tokens":
        raise DraftGenerationError(
            "תשובת המודל נקטעה כי הטיוטה ארוכה מדי. נסו שוב, או קצרו את המסר המרכזי."
        )

    tool_blocks = [block for block in response.content if block.type == "tool_use"]
    if tool_blocks and isinstance(tool_blocks[0].input, dict):
        data = tool_blocks[0].input
    else:
        # Fallback: the model answered in plain text instead of the tool.
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
    model_section = _parse_finansee_section(str(draft.get("cta", "")))
    merged = {key: editor_section[key] or model_section.get(key, "") for key in FINANSEE_SECTION_LABELS}
    empty = [FINANSEE_SECTION_LABELS[key] for key, value in merged.items() if not value.strip()]
    if empty:
        raise DraftGenerationError(
            "בפרק \"איך Finansee עוזרת\" שהמודל החזיר חסרים החלקים: " + ", ".join(empty) + ". נסו שוב."
        )
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


def _repair_missing_commas(text: str) -> str:
    """Known glitch in long drafts: the comma and opening quote before the next
    field are dropped, e.g.  ...לבד."action_steps":[  -> restore them."""
    for field in REQUIRED_FIELDS:
        text = re.sub(r'(?<=[^\s,{\[\\])"' + re.escape(field) + r'"\s*:', '","' + field + '":', text)
    return text


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = json.loads(_repair_missing_commas(text))
    if not isinstance(parsed, dict):
        raise ValueError("תשובת המודל אינה אובייקט JSON")
    return parsed
