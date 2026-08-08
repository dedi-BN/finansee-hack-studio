# Finansee Hack Studio

MVP לניהול ספריית ה-Hacks הפיננסיים של Finansee. אפליקציה עצמאית לחלוטין (ללא חיבור ל-Finansee/Dana/AI בשלב זה).

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy
- **DB:** SQLite (המרה ל-PostgreSQL בעתיד = החלפת משתנה סביבה `DATABASE_URL` בלבד)

## הרצה

### Backend (טרמינל 1)

```bash
cd backend
python -m venv venv
./venv/Scripts/activate      # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

בהרצה ראשונה נוצר קובץ `finansee_hacks.db` ומאוכלס אוטומטית ב-25 Hacks לדוגמה.
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
    seed.py         # יצירת 25 Hacks לדוגמה
    database.py      # חיבור ל-DB (SQLite -> PostgreSQL בעתיד)
frontend/
  src/
    pages/          # Dashboard, HackList, HackEditor, Preview
    components/       # רכיבי UI משותפים
    lib/            # api client + עזרי תצוגה
    constants.ts       # רשימות אפשרויות (גיל, תעסוקה, תחומי מומחיות...)
    types.ts          # טיפוסי TypeScript
```

## מוכן לעתיד

הקוד מובנה כך שיהיה קל להוסיף בעתיד (ללא מימוש כרגע): PostgreSQL, משתמשים והרשאות, workflow, אינטגרציה עם Dana/Finansee, ו-AI אמיתי (יש כפתור Placeholder בעורך).
