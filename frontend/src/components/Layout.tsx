import { NavLink, Outlet } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="text-lg font-bold tracking-tight">
            Finansee Hack Studio
          </NavLink>
          <nav className="flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              דשבורד
            </NavLink>
            <NavLink to="/hacks" className={navLinkClass}>
              רשימת Hacks
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
