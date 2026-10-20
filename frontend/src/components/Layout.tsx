import { Link, NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-4 py-2 rounded-full text-sm transition-colors ${
    isActive ? "bg-neutral-900 text-white font-bold" : "text-neutral-600 font-semibold hover:bg-white"
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="bg-[linear-gradient(180deg,#ffffff_0%,hsl(250_60%_98%)_60%,var(--color-neutral-50)_100%)]">
        <header className="mx-auto max-w-6xl px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Finansee Hack Studio - דשבורד">
              <span className="fin-ring w-9 h-9 rounded-full p-[3px]" aria-hidden>
                <span className="block w-full h-full rounded-full bg-white" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-lg font-extrabold tracking-tight">finansee</span>
                <span className="text-[11px] font-semibold text-neutral-500">Hack Studio</span>
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1.5" aria-label="ניווט ראשי">
              <NavLink to="/" end className={navLinkClass}>
                דשבורד
              </NavLink>
              <NavLink to="/hacks" end className={navLinkClass}>
                כל ה-Hacks
              </NavLink>
              <NavLink to="/hacks/new" className={navLinkClass}>
                יצירה עם AI
              </NavLink>
            </nav>
          </div>
          <Link
            to="/hacks/new"
            className="btn-primary inline-flex items-center gap-2 min-h-11 px-5 rounded-full text-sm font-bold"
          >
            <span aria-hidden>+</span>
            Hack חדש
          </Link>
        </header>
      </div>
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16">
        <Outlet />
      </main>
    </div>
  );
}
