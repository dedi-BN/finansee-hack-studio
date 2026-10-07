# Finansee Hack Studio

MVP לניהול ספריית ה-Hacks הפיננסיים של Finansee. כולל אשף יצירה שכותב טיוטה מלאה בעזרת Claude (Anthropic API). אין חיבור ל-Finansee/Dana בשלב זה.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy
- **DB:** SQLite מקומית כברירת מחדל. בסביבה החיה Postgres (Neon) דרך משתנה הסביבה `DATABASE_URL`
- **AI:** Claude דרך Anthropic API

## הרצה

### Backend (טרמינל 1)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate      # Windows
pip install -r requirements.txt
# צרו קובץ backend/.env עם ANTHROPIC_API_KEY=... (אופציונלי: ANTHROPIC_MODEL, DATABASE_URL)
python -m uvicorn app.main:app --reload --port 8000
```

בהרצה ראשונה נוצר קובץ `finansee_hacks.db` ומאוכלס אוטומטית ב-27 ה-Hacks שב-`app/hacks_data.py`.
ה-API זמין ב-http://127.0.0.1:8000, ותיעוד אוטומטי ב-http://127.0.0.1:8000/docs

### Frontend (טרמינל 2)

```bash
cd frontend
npm install
npm run dev
```

האפליקציה זמינה ב-http://localhost:5173 (שרת ה-dev מנתב קריאות `/api` אל ה-backend על פורט 8000).

אין משתמשים או סיסמאות — האפליקציה פתוחה, ללא מסך התחברות (כנדרש ב-MVP).

## מבנה הפרויקט

```
backend/
  app/
    main.py        # FastAPI app + endpoints
    models.py       # טבלת FinancialHack (SQLAlchemy)
    schemas.py       # Pydantic schemas
    crud.py         # שאילתות DB, חיפוש, סינון, מיון
    seed.py         # אכלוס DB ריק מ-hacks_data.py
    hacks_data.py      # התוכן של ה-Hacks המקוריים
    ai.py          # יצירת טיוטה עם Claude
    migrations.py      # הוספת עמודות חסרות בהפעלה (רק תוספות, אף פעם לא מחיקה)
  replace_dummy_seed_data.py # סנכרון תוכן מ-hacks_data.py ל-DB (ראו למטה)
    database.py      # חיבור ל-DB (SQLite או Postgres לפי DATABASE_URL)
frontend/
  src/
    pages/          # Dashboard, HackList, HackEditor, Preview, AiAssistant
    components/       # רכיבי UI משותפים
    lib/            # api client + עזרי תצוגה
    constants.ts       # רשימות אפשרויות (גיל, תעסוקה, תחומי מומחיות...)
    types.ts          # טיפוסי TypeScript
```

## עדכון תוכן מהקוד (replace_dummy_seed_data.py)

הסקריפט מעדכן את ה-Hacks המקוריים לפי הטקסט ב-`app/hacks_data.py`, ועובד מול ה-DB ש-`DATABASE_URL` מצביע עליו (מקומי או Neon). הוא לא דורס עריכות שנעשו בממשק, ולא משנה סטטוס של Hack קיים.

```bash
cd backend
python replace_dummy_seed_data.py            # בדיקה בלבד - מציג מה ישתנה
python replace_dummy_seed_data.py --apply    # גיבוי ל-backend/backups/ ואז עדכון
python replace_dummy_seed_data.py --apply --force   # גם דורס Hacks שנערכו בממשק
```

תמיד להריץ קודם בלי `--apply` ולקרוא את הפלט.

## מוכן לעתיד

הקוד מובנה כך שיהיה קל להוסיף בעתיד: משתמשים והרשאות, workflow, ואינטגרציה עם Dana/Finansee.
