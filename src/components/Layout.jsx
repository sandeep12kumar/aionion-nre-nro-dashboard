import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/aionion-logo.png";
import { useAuth, ROLE_LABELS } from "../lib/auth";
import { api } from "../lib/api";
import { BellIcon, CardIcon, FileIcon, GridIcon, LogoutIcon, MenuIcon, MoonIcon, SunIcon, TableIcon, UserIcon, UsersIcon, VideoIcon, XIcon } from "./icons";
import { Field, Modal, PasswordInput } from "./ui";

const NAV = [
  { to: "/", label: "Dashboard", module: "dashboard", icon: GridIcon, end: true },
  { to: "/clients", label: "Clients", module: "clients", icon: UsersIcon },
  { to: "/payments", label: "Payments", module: "payments", icon: CardIcon },
  { to: "/ipv", label: "IPV Verification", module: "ipv", icon: VideoIcon },
  { to: "/boid", label: "BOID Numbers", module: "boid", icon: TableIcon },
  { to: "/users", label: "User Management", module: "users", icon: UserIcon },
  { to: "/audit-logs", label: "Audit Logs", module: "audit", icon: FileIcon },
];

const TITLES = [
  [/^\/$/, "NRI Dashboard"],
  [/^\/clients\/[^/]+/, "NRE - NRO Client Details"],
  [/^\/clients/, "Clients"],
  [/^\/payments/, "Payments"],
  [/^\/ipv\/\d+/, "IPV Details"],
  [/^\/ipv/, "IPV Video Verification"],
  [/^\/boid/, "BOID Numbers"],
  [/^\/users/, "User Management"],
  [/^\/audit-logs/, "Audit Logs"],
];

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("nri_dash_theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  };
  return [dark, toggle];
}

function Sidebar({ onNavigate }) {
  const { can } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/" onClick={onNavigate} className="block border-b border-slate-100 px-6 pb-5 pt-6 dark:border-slate-800">
        <img src={logo} alt="Aionion Capital" className="h-14 dark:rounded-lg dark:bg-white dark:p-1" />
      </Link>
      <div className="px-4 pt-5">
        <p className="flex items-center justify-between rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm font-bold tracking-wide text-white shadow-brand">
          NRE - NRO
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">NRI</span>
        </p>
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-4">
        {NAV.filter((item) => can(item.module)).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] transition ${
                isActive
                  ? "bg-primary-600 font-semibold text-white shadow-brand"
                  : "text-slate-600 hover:bg-primary-50 hover:text-primary-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <p className="px-6 pb-6 pt-4 text-[10px] font-semibold tracking-[0.25em] text-slate-400">RESEARCH | TRUST | FOREVER</p>
    </div>
  );
}

function Notifications() {
  const { can } = useAuth();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (!can("dashboard")) return undefined;
    const load = () => api.get("/summary").then((d) => setAlerts(d.alerts || [])).catch(() => {});
    load();
    const timer = setInterval(load, 120000);
    return () => clearInterval(timer);
  }, [can]);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" aria-label="Notifications">
        <BellIcon />
        {alerts.length > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />}
      </button>
      {open && (
        <div className="card absolute right-0 z-40 mt-2 w-80 p-2">
          {alerts.length ? alerts.map((a) => (
            <Link key={a.text} to={a.link} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className={a.level === "warning" ? "text-amber-600" : "text-slate-700 dark:text-slate-200"}>{a.text}</span>
            </Link>
          )) : <p className="px-3 py-4 text-center text-sm text-slate-400">No alerts</p>}
        </div>
      )}
    </div>
  );
}

function ChangePasswordModal({ open, onClose }) {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setCurrent(""); setNext(""); setConfirm(""); setError(""); setDone(false);
    onClose();
  };
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("The new password must be at least 8 characters.");
    if (next !== confirm) return setError("The new passwords don't match.");
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Change password">
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-600">Your password has been changed. Other sessions have been signed out.</p>
          <button type="button" className="btn-primary w-full" onClick={close}>Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Current password"><PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" /></Field>
          <Field label="New password (at least 8 characters)"><PasswordInput value={next} onChange={(e) => setNext(e.target.value)} /></Field>
          <Field label="Confirm new password"><PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
        </form>
      )}
    </Modal>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dark, toggleTheme] = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const title = TITLES.find(([pattern]) => pattern.test(location.pathname))?.[1] || "NRI Dashboard";

  useEffect(() => setMenuOpen(false), [location.pathname]);
  useEffect(() => {
    document.title = `${title} — NRI Dashboard`;
  }, [title]);

  return (
    <div className="min-h-screen lg:pl-72">
      <div className="brand-strip fixed inset-x-0 top-0 z-40" />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-slate-200/70 bg-white/90 pt-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900 lg:block">
        <Sidebar />
      </aside>
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="relative h-full w-72 bg-white dark:bg-slate-900">
            <button type="button" className="absolute right-3 top-3 p-2 text-slate-400" onClick={() => setMenuOpen(false)} aria-label="Close menu"><XIcon /></button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3 px-4 pb-2 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-center gap-3">
          <button type="button" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Notifications />
          <button type="button" onClick={toggleTheme} className="btn-outline !rounded-full">
            {dark ? <MoonIcon className="h-4 w-4" /> : <SunIcon className="h-4 w-4" />}
            <span className="hidden sm:inline">{dark ? "Dark Mode" : "Light Mode"}</span>
          </button>
          <span className="hidden px-1 text-sm text-slate-500 md:inline" title={user?.username}>
            {user?.fullName || user?.username} · {ROLE_LABELS[user?.role]}
          </span>
          <button type="button" className="btn-outline hidden sm:inline-flex" onClick={() => setPasswordOpen(true)}>Change password</button>
          <button type="button" className="btn-outline" onClick={logout}>
            <LogoutIcon className="h-4 w-4 sm:hidden" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="px-4 pb-10 pt-4 sm:px-8">
        <Outlet />
      </main>
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
