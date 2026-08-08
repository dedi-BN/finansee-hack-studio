// A fully client-side, deterministic "writing assistant". It is NOT a real
// LLM integration - wiring one in would require a backend endpoint (to keep
// an API key server-side), which is explicitly out of scope for this pass.
// Instead this module drives the guided wizard with genuinely useful,
// rule-based content scaffolding: category detection from the topic,
// template-based title/draft generation seeded by the user's own answers,
// and heuristic editorial tips. Everything it produces is meant to be a
// starting draft the human then edits, not a finished article.

import type { HackInput, HackStatus } from "../types";
import { serializeFinanseeSection, type FinanseeSection } from "./finansee";

export interface AudienceAnswers {
  age_groups: string[];
  family_status: string[];
  employment: string[];
  financial_status: string[];
}

export const CORE_MESSAGE_OPTIONS = [
  "אנשים מפסידים כסף",
  "אנשים לא מודעים לבעיה",
  "אפשר לחסוך כסף",
  "אפשר למנוע טעות",
] as const;

interface CategoryProfile {
  expertise: string;
  keywords: string[];
  finansee: {
    knows: string;
    needed: string;
    analyzes: (topic: string) => string;
    receives: string;
    nextStepVerb: string;
  };
}

const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    expertise: "פנסיה",
    keywords: ["פנסיה", "דמי ניהול", "קרן פנסיה", "פרישה", "מסלול השקעה"],
    finansee: {
      knows: "פרופיל הגיל והתעסוקה שלך, וכל קרנות הפנסיה הרשומות על שמך דרך מסלקת הפנסיה - כולל דמי ניהול ומסלולי השקעה נוכחיים.",
      needed: "אם עדיין לא חיברתם את מסלקת הפנסיה - רק אישור חיבור חד-פעמי. לעיתים גם תלוש שכר עדכני.",
      analyzes: (topic) => `משווה את הנתונים שלכם מול ממוצע השוק ומאתרת פערים ב${topic}.`,
      receives: "דוח אישי שמראה בדיוק איפה אתם עומדים ומה אפשר לשפר.",
      nextStepVerb: "בדקו",
    },
  },
  {
    expertise: "קופות גמל",
    keywords: ["קופת גמל", "קופות גמל", "גמל להשקעה"],
    finansee: {
      knows: "את כל קופות הגמל הרשומות על שמך דרך מסלקת הפנסיה, כולל גובה הצבירה והמסלול הנוכחי.",
      needed: "לרוב שום מסמך נוסף - הנתונים כבר קיימים דרך המסלקה.",
      analyzes: (topic) => `בודקת את ${topic} מול חלופות ומול מטרת החיסכון שהגדרתם.`,
      receives: "השוואה ברורה בין המוצרים הקיימים שלכם והמלצה מותאמת.",
      nextStepVerb: "בדקו",
    },
  },
  {
    expertise: "קרן השתלמות",
    keywords: ["קרן השתלמות", "השתלמות"],
    finansee: {
      knows: "את תאריך פתיחת קרן ההשתלמות שלך, גובה הצבירה והמסלול, מתוך נתוני המסלקה.",
      needed: "רק אישור לגשת לנתוני הקרן דרך המסלקה, אם עדיין לא בוצע חיבור.",
      analyzes: (topic) => `בודקת את ${topic} מול הנתונים שלכם ומול חלופות רלוונטיות.`,
      receives: "המלצה מותאמת אישית לגבי הקרן וההפקדה שלכם.",
      nextStepVerb: "בדקו",
    },
  },
  {
    expertise: "ביטוח",
    keywords: ["ביטוח", "ביטוחים", "כפל ביטוחי", "אובדן כושר"],
    finansee: {
      knows: "את הביטוחים הרשומים על שמך שחוברו למערכת, כולל ביטוחי מנהלים ופנסיה עם רכיב ביטוחי.",
      needed: "פוליסות נוספות שלא חוברו אוטומטית, אם קיימות.",
      analyzes: (topic) => `משווה בין הכיסויים הקיימים שלכם ומאתרת פערים או כפילויות ב${topic}.`,
      receives: "מפת ביטוחים אישית עם המלצות ברורות לפעולה.",
      nextStepVerb: "העלו את הפוליסות שלכם ובדקו",
    },
  },
  {
    expertise: "השקעות",
    keywords: ["השקעה", "השקעות", "תיק השקעות", "מניות", "מדד", "פיזור"],
    finansee: {
      knows: "את גילכם ולעיתים גם את החשיפה הקיימת שלכם לשוק ההון דרך מסלולי הפנסיה וההשתלמות.",
      needed: "מטרת ההשקעה ואופק הזמן שלכם, ולעיתים דוח תיק השקעות עדכני.",
      analyzes: (topic) => `בודקת את ההתאמה בין ${topic} לאופק הזמן ולרמת הסיכון המתאימה לכם.`,
      receives: "המלצה מותאמת אישית, לא הנחיה גורפת אחת לכולם.",
      nextStepVerb: "הגדירו את מטרת ההשקעה שלכם ובדקו",
    },
  },
  {
    expertise: "משכנתאות",
    keywords: ["משכנתא", "משכנתאות", "מחזור משכנתא"],
    finansee: {
      knows: "פרטי המשכנתא הרשומים שלכם אם חוברו, כולל יתרת קרן ותמהיל המסלולים.",
      needed: "דוח יתרות משכנתא עדכני מהבנק.",
      analyzes: (topic) => `בודקת את תמהיל המסלולים והריבית שלכם מול האלטרנטיבות הזמינות ל${topic}.`,
      receives: "ניתוח שמראה אם מחזור משכנתא או שינוי תמהיל יכולים לחסוך לכם כסף.",
      nextStepVerb: "העלו דוח יתרות ובדקו",
    },
  },
  {
    expertise: "מיסוי",
    keywords: ["מס", "מיסוי", "החזר מס", "106"],
    finansee: {
      knows: "את מצב התעסוקה שלכם, כולל אם עבדתם בכמה מקומות עבודה השנה.",
      needed: "טפסי 106 מכל מקומות העבודה הרלוונטיים.",
      analyzes: (topic) => `בודקת את ${topic} מול ההכנסה הכוללת שלכם והמס שנוכה בפועל.`,
      receives: "אינדיקציה ברורה אם מגיע לכם החזר, ובאיזה טווח סכום.",
      nextStepVerb: "העלו טפסי 106 ובדקו",
    },
  },
  {
    expertise: "בנקאות",
    keywords: ["בנק", "עו\"ש", "מינוס", "עמלות"],
    finansee: {
      knows: "את דפוס השימוש שלכם בחשבון הבנק, ככל שהוא מחובר למערכת.",
      needed: "דף חשבון בנק עדכני.",
      analyzes: (topic) => `בודקת עמלות, ריביות ותנאים הקשורים ל${topic} מול חלופות זמינות.`,
      receives: "המלצות קונקרטיות לשיפור התנאים בחשבון שלכם.",
      nextStepVerb: "העלו דף חשבון ובדקו",
    },
  },
  {
    expertise: "אשראי",
    keywords: ["אשראי", "הלוואה", "הלוואות", "כרטיס אשראי"],
    finansee: {
      knows: "פרופיל האשראי הבסיסי שלכם, אם חובר למערכת.",
      needed: "פירוט הלוואות או כרטיסי אשראי קיימים.",
      analyzes: (topic) => `משווה את ${topic} מול חלופות זולות יותר בשוק.`,
      receives: "המלצה אם כדאי לאחד הלוואות או לשנות מסגרת אשראי.",
      nextStepVerb: "השוו ובדקו",
    },
  },
  {
    expertise: "כלכלת המשפחה",
    keywords: ["משפחה", "תקציב", "ילדים", "חיסכון משפחתי"],
    finansee: {
      knows: "את המצב המשפחתי והתעסוקתי הרשום בפרופיל שלכם.",
      needed: "פירוט הכנסות והוצאות קבועות של משק הבית.",
      analyzes: (topic) => `בונה תמונת מצב פיננסית משפחתית סביב ${topic} ומזהה נקודות לשיפור.`,
      receives: "תוכנית פעולה מותאמת למצב המשפחתי הספציפי שלכם.",
      nextStepVerb: "בדקו",
    },
  },
];

const FALLBACK_PROFILE = CATEGORY_PROFILES[0];

export function detectCategory(topic: string): string {
  const t = topic.trim();
  if (!t) return FALLBACK_PROFILE.expertise;
  let best = FALLBACK_PROFILE;
  let bestScore = 0;
  for (const profile of CATEGORY_PROFILES) {
    const score = profile.keywords.filter((k) => t.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = profile;
    }
  }
  return best.expertise;
}

function profileFor(expertise: string): CategoryProfile {
  return CATEGORY_PROFILES.find((p) => p.expertise === expertise) ?? FALLBACK_PROFILE;
}

export function suggestFinanseeSection(topic: string, expertise: string): FinanseeSection {
  const profile = profileFor(expertise);
  const t = topic.trim() || "הנושא הזה";
  return {
    knows: profile.finansee.knows,
    needed: profile.finansee.needed,
    analyzes: profile.finansee.analyzes(t),
    receives: profile.finansee.receives,
    nextStep: `${profile.finansee.nextStepVerb} את ${t} ב-Finansee`,
  };
}

const TITLE_TEMPLATES: ((topic: string) => string)[] = [
  (t) => `איך לבדוק אם ${t} עולה לכם יותר מדי`,
  (t) => `3 דברים שכדאי לדעת על ${t} לפני שמאוחר מדי`,
  (t) => `האם אתם מפסידים כסף בגלל ${t}? הנה איך לבדוק`,
  (t) => `${t}: המדריך הקצר שיכול לחסוך לכם כסף`,
  (t) => `מה Finansee יודעת על ${t} שאתם כנראה לא`,
  (t) => `הטעות הכי נפוצה בכל הקשור ל${t}`,
  (t) => `${t} בלי כאב ראש: מה צריך לבדוק ומה כבר ידוע עליכם`,
  (t) => `האם ${t} שלכם באמת מעודכן? כך בודקים בכמה דקות`,
  (t) => `למה רוב האנשים לא בודקים ${t} - וזו טעות`,
  (t) => `${t}: מה שאתם לא יודעים עלול לעלות לכם כסף`,
];

export function generateTitles(topic: string, count = 5, exclude: string[] = []): string[] {
  const t = topic.trim() || "הנושא הזה";
  const excludeSet = new Set(exclude);
  const candidates = TITLE_TEMPLATES.map((fn) => fn(t)).filter((title) => !excludeSet.has(title));
  const pool = candidates.length >= count ? candidates : TITLE_TEMPLATES.map((fn) => fn(t));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function messageClause(message: string): string {
  switch (message) {
    case "אנשים מפסידים כסף":
      return "כמה כסף אתם בעצם מפסידים בלי לשים לב";
    case "אנשים לא מודעים לבעיה":
      return "בעיה שרוב האנשים לא יודעים שקיימת";
    case "אפשר לחסוך כסף":
      return "כמה אפשר לחסוך בלי מאמץ מיוחד";
    case "אפשר למנוע טעות":
      return "טעות נפוצה שקל למנוע אם יודעים עליה בזמן";
    default:
      return message.trim() || "מה כדאי לבדוק ולמה זה חשוב";
  }
}

export interface DraftInput {
  topic: string;
  coreMessage: string;
  audience: AudienceAnswers;
  finansee: FinanseeSection;
  title: string;
  expertise: string;
}

export function generateDraft(input: DraftInput): HackInput {
  const t = input.topic.trim() || "הנושא הזה";
  const clause = messageClause(input.coreMessage);

  const subtitle = `בדיקה קצרה של ${t} יכולה לחשוף ${clause} - ו-Finansee עושה את רוב העבודה בשבילכם.`;

  const hook = `רוב האנשים לא בודקים ${t} עד שכבר מאוחר מדי. הבדל קטן שנראה לא משמעותי היום עלול להצטבר לאורך זמן לסכום גדול בהרבה ממה שהייתם מניחים - וזו בדיוק הסיבה ששווה לעצור רגע ולבדוק.`;

  const whyItMatters = `זהו נושא שנוגע לחלק גדול מהציבור, אבל נשאר לרוב בצד כי הוא נראה מורכב מדי לגשת אליו לבד. ברגע שיש כלי שכבר מכיר חלק מהנתונים - כמו Finansee - המחסום הזה נעלם, וההבדל בין "לדעת שצריך לבדוק" לבין "לבדוק בפועל" מצטמצם לכמה דקות.`;

  const problem = `כדי לבדוק את ${t} לבד, בדרך כלל צריך לאתר את כל המסמכים הרלוונטיים, להבין מונחים מקצועיים ולהשוות נתונים בלי שום נקודת ייחוס ברורה. זהו תהליך שגוזל זמן ולרוב נדחה שוב ושוב - וזו בדיוק הסיבה שרוב האנשים אף פעם לא מגיעים לבדוק את זה בעצמם, גם כשהם יודעים שכדאי.`;

  const exampleStory = `נניח שמישהו רוצה לבדוק את ${t}, אבל לא בטוח איך להתחיל ואילו מסמכים בדיוק צריך להוציא. ברוב המקרים זו בדיוק הסיבה לדחיינות - לא חוסר רצון, אלא חוסר ידיעה מאיפה להתחיל ומה בכלל אמורה להיות התוצאה הסופית.`;

  const content = `הצעד הראשון הוא תמיד להבין מה בעצם בודקים ולמה זה משנה עבורכם באופן אישי - כי ${t} משפיע אחרת על כל אחד, בהתאם למצב האישי, ההכנסה והמטרות. אין תשובה אחת שמתאימה לכולם, אבל יש שאלות בסיסיות שכדאי לשאול לפני שממשיכים הלאה.

כאן בדיוק נכנסת לתמונה Finansee: המערכת כבר מכירה חלק מהמידע הרלוונטי לגבי ${t} מתוך הפרופיל הפיננסי שלכם, ולכן אינכם צריכים לאסוף הכול מאפס. Finansee משלימה רק את הפרטים החסרים, מריצה את הניתוח הרלוונטי, ומחזירה לכם תובנה מותאמת אישית - במקום עוד מאמר כללי שאתם צריכים לתרגם לבד למצב שלכם.

בסופו של דבר, ההבדל בין מי שממשיך לדחות את הבדיקה למי שכבר מטפל בזה הוא לא כמות הידע הפיננסי שיש לו, אלא כמה קל לו להתחיל. וזו בדיוק המטרה כאן.`;

  const actionSteps = [
    `בדקו מה כבר ידוע עליכם ב-Finansee לגבי ${t}, בלי צורך לאסוף הכול מחדש.`,
    "השלימו רק את המידע החסר שהמערכת מבקשת מכם.",
    "עברו על הניתוח האישי שמתקבל וזהו את הפערים או ההזדמנויות שמצוינות בו.",
    "בצעו את הפעולה המומלצת ישירות דרך Finansee.",
  ];

  const cautions = `המידע הכללי כאן הוא נקודת פתיחה בלבד ואינו מחליף ייעוץ פיננסי, פנסיוני, ביטוחי או מיסויי המותאם לנתונים האישיים שלכם. במקרים מורכבים, מומלץ לשלב גם ייעוץ מקצועי לצד הניתוח שמתקבל ב-Finansee.`;

  const bottomLine = `${t} הוא בדיוק סוג הבדיקה שקל לדחות כי היא נראית מסובכת - אבל כש-Finansee כבר מכירה חלק מהתמונה, הבדיקה הופכת לקצרה ופשוטה בהרבה ממה שנדמה.`;

  return {
    title: input.title || `בדיקת ${t}`,
    subtitle,
    hook,
    why_it_matters: whyItMatters,
    problem,
    example_story: exampleStory,
    content,
    action_steps: actionSteps,
    cautions,
    bottom_line: bottomLine,
    cta: serializeFinanseeSection(input.finansee),
    professional_notes: "טיוטה ראשונה שנוצרה בעזרת עוזר הכתיבה - יש לעבור, לערוך ולאמת לפני פרסום.",
    sources: "נדרש אימות מקצועי לפני פרסום.",
    age_groups: input.audience.age_groups.length ? input.audience.age_groups : ["כולם"],
    family_status: input.audience.family_status.length ? input.audience.family_status : ["כולם"],
    employment: input.audience.employment.length ? input.audience.employment : ["כולם"],
    financial_status: input.audience.financial_status.length ? input.audience.financial_status : ["כולם"],
    expertise: [input.expertise],
    importance: 3,
    virality: 3,
    potential_savings: 3,
    urgency: 2,
    status: "Draft" as HackStatus,
  };
}

// --- Permanent AI Assistant panel: heuristic editorial tips ---

export interface EditorialTip {
  id: string;
  label: string;
  evaluate: (hack: HackInput) => string;
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function avgSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length === 0) return 0;
  const total = sentences.reduce((sum, s) => sum + wordCount(s), 0);
  return total / sentences.length;
}

export const EDITORIAL_TIPS: EditorialTip[] = [
  {
    id: "title",
    label: "שפרו כותרת",
    evaluate: (h) => {
      const words = wordCount(h.title);
      if (!words) return "עדיין אין כותרת. כותרות טובות מתחילות ב'איך', כוללות מספר, או שואלות שאלה ישירה לקורא.";
      if (words < 4) return `הכותרת קצרה (${words} מילים) - כותרות של 6-12 מילים בדרך כלל מעבירות יותר מידע ומזמינות יותר קליקים.`;
      if (words > 14) return `הכותרת ארוכה (${words} מילים) - שקלו לקצר כדי שתישאר קריאה ברשימת ה-Hacks ובתצוגה המקדימה.`;
      return "אורך הכותרת תקין. ודאו שהיא מבטיחה תועלת ברורה לקורא, לא רק מתארת נושא.";
    },
  },
  {
    id: "hook",
    label: "שפרו Hook",
    evaluate: (h) => {
      const words = wordCount(h.hook);
      if (!words) return "אין עדיין Hook. פתיחה טובה יוצרת מתח או סקרנות בשני-שלושה משפטים, לפני שנכנסים לפרטים.";
      if (h.hook.trim() === h.title.trim()) return "ה-Hook זהה לכותרת - כדאי שיוסיף זווית חדשה ולא רק יחזור עליה.";
      if (words < 15) return "ה-Hook קצר מאוד - שקלו להוסיף עוד משפט שמסביר למה כדאי להמשיך לקרוא.";
      return "אורך ה-Hook סביר. ודאו שהוא נפתח בבעיה או בשאלה, לא בפתרון.";
    },
  },
  {
    id: "article",
    label: "שפרו את המאמר",
    evaluate: (h) => {
      const paragraphs = h.content.split("\n\n").filter((p) => p.trim());
      if (!h.content.trim()) return "עדיין אין הסבר מקצועי. זהו הגוף המרכזי של המאמר - כדאי 2-4 פסקאות.";
      if (paragraphs.length < 2) return "ההסבר המקצועי נראה כמו פסקה אחת ארוכה - שברו אותו לכמה פסקאות קצרות יותר, כל אחת עם רעיון אחד.";
      return `ההסבר המקצועי כולל ${paragraphs.length} פסקאות - מבנה סביר. ודאו שכל פסקה מתקדמת רעיון חדש.`;
    },
  },
  {
    id: "readability",
    label: "שפרו קריאוּת",
    evaluate: (h) => {
      const avg = avgSentenceLength(h.content || h.problem);
      if (!avg) return "אין עדיין מספיק טקסט לבדיקת קריאוּת.";
      if (avg > 28) return `אורך המשפט הממוצע גבוה (כ-${Math.round(avg)} מילים) - משפטים קצרים יותר קלים יותר לקריאה, במיוחד במובייל.`;
      return `אורך המשפט הממוצע תקין (כ-${Math.round(avg)} מילים). המשיכו לשמור על משפטים ברורים.`;
    },
  },
  {
    id: "seo",
    label: "שפרו SEO",
    evaluate: (h) => {
      if (!h.subtitle.trim()) return "אין כותרת משנה - היא חשובה גם לקורא וגם למנועי חיפוש, ומומלץ שתכלול את מילות המפתח המרכזיות.";
      const titleWords = new Set(h.title.split(/\s+/).filter((w) => w.length > 2));
      const inSubtitle = [...titleWords].some((w) => h.subtitle.includes(w));
      if (!inSubtitle) return "לכותרת ולכותרת המשנה כמעט אין מילים משותפות - כדאי לוודא שמילת המפתח המרכזית מופיעה בשתיהן.";
      return "כותרת וכותרת משנה חולקות מילות מפתח - טוב ל-SEO. ודאו גם שה-Hook פותח באותו נושא.";
    },
  },
  {
    id: "storytelling",
    label: "שפרו Storytelling",
    evaluate: (h) => {
      const words = wordCount(h.example_story);
      if (!words) return "אין עדיין דוגמה מהחיים - סיפור קצר וקונקרטי עוזר לקורא לדמיין את עצמו במצב הזה.";
      if (words < 20) return "הדוגמה מהחיים קצרה - הוסיפו פרט אנושי אחד נוסף (גיל, מצב, החלטה) כדי שהיא תרגיש אמיתית יותר.";
      return "הדוגמה מהחיים מספקת אורך סביר. ודאו שהיא היפותטית בלבד ולא מוצגת כמקרה אמיתי בלי מקור.";
    },
  },
  {
    id: "finansee",
    label: "שפרו שילוב Finansee",
    evaluate: (h) => {
      const mentionsInBody = [h.hook, h.problem, h.content].some((t) => t.includes("Finansee"));
      if (!mentionsInBody) return "השם 'Finansee' לא מופיע בגוף המאמר עצמו (Hook / הבעיה / ההסבר המקצועי) - רק בתיבת הסיכום זה לא מספיק. שלבו אותו באופן טבעי גם באמצע המאמר.";
      return "Finansee משולבת גם בגוף המאמר, לא רק בסיכום - כיוון נכון. ודאו שהתיבה בתחתית המאמר עדיין מלאה בכל 5 החלקים.";
    },
  },
  {
    id: "value",
    label: "חזקו ערך ללקוח",
    evaluate: (h) => {
      if (!h.bottom_line.trim() || !h.why_it_matters.trim()) return "'למה זה חשוב' ו'בשורה התחתונה' הם המקומות שבהם מסבירים לקורא מה הוא מרוויח - ודאו ששניהם מלאים וממוקדים בתועלת, לא רק בעובדות.";
      return "יש תוכן גם ב'למה זה חשוב' וגם ב'בשורה התחתונה' - ודאו ששניהם מדברים על התועלת ללקוח, לא רק מתארים את הנושא.";
    },
  },
  {
    id: "example",
    label: "הוסיפו דוגמה מעשית",
    evaluate: (h) => {
      if (h.action_steps.filter((s) => s.trim()).length < 3) return "יש פחות משלושה צעדים מעשיים - הוסיפו עוד צעד קונקרטי כדי שהקורא ידע בדיוק מה לעשות אחרי הקריאה.";
      return `יש ${h.action_steps.filter((s) => s.trim()).length} צעדים מעשיים - מספר סביר. ודאו שכל צעד הוא פעולה קונקרטית, לא עצה כללית.`;
    },
  },
  {
    id: "cta",
    label: "שפרו CTA",
    evaluate: (h) => {
      const generic = ["לכו לבדוק", "דברו עם", "קראו עוד", "בדקו את זה"];
      const nextStepMatch = h.cta.match(/## הצעד הבא\n([\s\S]*?)(\n\n##|$)/);
      const nextStep = nextStepMatch ? nextStepMatch[1].trim() : "";
      if (!nextStep) return "אין עדיין 'הצעד הבא' בתיבת Finansee - זו הפעולה הכי חשובה במאמר.";
      if (generic.some((g) => nextStep.includes(g))) return "הצעד הבא נשמע כללי מדי - נסחו אותו כפעולה קונקרטית בתוך Finansee, למשל 'העלו את...' או 'בדקו את... ב-Finansee'.";
      if (!nextStep.includes("Finansee")) return "הצעד הבא לא מזכיר את Finansee במפורש - ודאו שהוא מפנה לפעולה בתוך המערכת, לא לעצה כללית.";
      return "הצעד הבא ממוקד ומפנה לפעולה בתוך Finansee - בול.";
    },
  },
];
