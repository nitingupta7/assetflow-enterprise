import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Toaster } from "sonner";
import { navItems, roleOptions } from "../lib/routes";
import { cn } from "../lib/utils";
import { useApp } from "../context/useApp";
import { Button, Input } from "./ui";

export const AppShell = () => {
  const { selectedRole, setSelectedRole, theme, toggleTheme, logout, user } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const availableNav = useMemo(() => navItems.filter((item) => item.roles.includes(selectedRole)), [selectedRole]);
  const unread = 4;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={cn("flex h-full w-[260px] flex-col border-r border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-950", mobile && "w-full")}>
      <Link to="/dashboard" className="mb-8 flex items-center gap-3 px-2" onClick={() => setMobileOpen(false)}>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-lg font-black text-white">AF</div>
        <div>
          <div className="text-xl font-black text-slate-950 dark:text-white">AssetFlow</div>
          <div className="text-xs font-medium text-slate-500">Enterprise assets</div>
        </div>
      </Link>
      <nav className="space-y-1">
        {availableNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
              isActive && "bg-emerald-50 text-primary dark:bg-emerald-950/40 dark:text-emerald-300",
            )}
          >
            <item.icon size={18} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
        <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Demo role</label>
        <select className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as typeof selectedRole)}>
          {roleOptions.map((role) => <option key={role}>{role}</option>)}
        </select>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Toaster richColors position="top-right" />
      <div className="fixed inset-y-0 left-0 hidden lg:block"><Sidebar /></div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />
          <div className="relative h-full w-80 max-w-[86vw] bg-white shadow-2xl dark:bg-slate-950">
            <button className="absolute right-3 top-3 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={20} /></button>
            <Sidebar mobile />
          </div>
        </div>
      ) : null}
      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-8">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={22} /></button>
            <div className="relative hidden flex-1 md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input className="pl-10" placeholder="Search assets, people, QR codes..." />
            </div>
            <Button variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</Button>
            <button className="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-900" onClick={() => navigate("/notifications")} aria-label="Notifications">
              <Bell size={20} />
              <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{unread}</span>
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-bold">{user?.name ?? "Demo User"}</div>
              <div className="text-xs text-slate-500">{selectedRole}</div>
            </div>
            <Button variant="ghost" onClick={() => logout().then(() => navigate("/login"))} aria-label="Logout"><LogOut size={18} /></Button>
          </div>
          <div className="mt-3 text-xs font-medium text-slate-500 md:hidden">{location.pathname}</div>
        </header>
        <main className="px-4 py-6 sm:px-8">{<Outlet />}</main>
      </div>
    </div>
  );
};
