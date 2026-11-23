import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, XIcon } from "./icons";

export function PageTitle({ children, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white lg:text-3xl">{children}</h1>
      {actions}
    </div>
  );
}

const TONES = {
  default: "text-slate-900 dark:text-white",
  green: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-500",
  red: "text-red-500",
  violet: "text-violet-600 dark:text-violet-400",
};

// A number card. Clickable when onClick is given; `active` outlines it.
export function StatCard({ label, value, sub, tone = "default", subTone, onClick, active }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`card w-full p-5 text-left transition ${onClick ? "hover:border-violet-300 hover:shadow-md" : ""} ${
        active ? "!border-violet-500 ring-1 ring-violet-500" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${TONES[tone]}`}>{value ?? "–"}</p>
      {sub !== undefined && <p className={`mt-1 text-sm font-medium ${TONES[subTone || tone] || ""} ${tone === "default" ? "!text-slate-500" : ""}`}>{sub}</p>}
    </Tag>
  );
}

const BADGES = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  amber: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  red: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  violet: "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  slate: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  pink: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30",
};

export function Badge({ tone = "slate", children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${BADGES[tone]}`}>{children}</span>;
}

export function TypeBadge({ type }) {
  if (!type) return <span className="muted">N/A</span>;
  return <Badge tone={type === "NRE" ? "blue" : "amber"}>{type}</Badge>;
}

const STATUS_TONES = {
  success: "green", completed: "green", esigned: "green", submitted: "green", verified: "green",
  pending: "amber", requested: "amber", in_progress: "violet", live: "blue",
  failed: "red", cancelled: "slate", abandoned: "red",
};
export function StatusBadge({ value, label }) {
  if (!value) return <span className="muted">N/A</span>;
  return <Badge tone={STATUS_TONES[value] || "slate"}>{label || String(value).replace(/_/g, " ").replace(/\b\w/, (c) => c.toUpperCase())}</Badge>;
}

export function CopyButton({ value, className = "" }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      title="Copy"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(String(value)).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        });
      }}
      className={`ml-2 inline-flex items-center gap-1 rounded-md border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 ${className}`}
    >
      {done ? <CheckIcon className="h-3.5 w-3.5 text-emerald-500" /> : <CopyIcon className="h-3.5 w-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export const Spinner = ({ className = "h-5 w-5" }) => (
  <span className={`inline-block animate-spin rounded-full border-2 border-violet-500 border-t-transparent ${className}`} aria-label="Loading" />
);

export function Loading({ text = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <Spinner /> {text}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <span>{error.message || String(error)}</span>
      {onRetry && <button type="button" className="font-semibold underline" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Empty({ children = "No records match these filters." }) {
  return <div className="px-4 py-14 text-center text-sm text-slate-400">{children}</div>;
}

export function Pagination({ page, pageSize, total, onPage, onPageSize, sizes = [25, 50, 100] }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 dark:border-slate-800">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>Showing {from}-{to} of {total}</span>
        {onPageSize && (
          <select className="input !h-9 !w-auto" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {sizes.map((s) => <option key={s} value={s}>{s} / page</option>)}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="text-sm text-slate-500">Page {page} of {pages}</span>
        <button type="button" className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
}

export function Drawer({ open, onClose, children, width = "max-w-xl" }) {
  useEscape(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={`relative h-full w-full ${width} overflow-y-auto bg-white p-6 shadow-2xl dark:bg-slate-900`}>{children}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width = "max-w-md" }) {
  useEscape(onClose);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className={`card relative w-full ${width} p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Show / hide toggle inside a password input
export function PasswordInput({ value, onChange, placeholder, autoComplete = "new-password", id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} className="input pr-16" type={show ? "text" : "password"} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

// A text filter that reports its value after typing pauses (one API call, not one per key).
export function SearchInput({ value, onChange, placeholder, className = "", delay = 400 }) {
  const [text, setText] = useState(value || "");
  useEffect(() => setText(value || ""), [value]);
  useEffect(() => {
    if (text === (value || "")) return undefined;
    const timer = setTimeout(() => onChange(text.trim()), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return <input className={`input ${className}`} value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} />;
}

// Loads data for the current filters; reload() fetches again.
export function useLoader(load, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    load()
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState((s) => ({ ...s, error, loading: false })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

// The summary at the top of a detail page: a heading row (title + badges,
// meta on the right) and an even grid of label / value pairs underneath.
// items: [[label, value, { wide }], ...] -- wide takes two columns (emails, places)
export function SummaryCard({ title, badges, meta, items }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h2 className="truncate text-xl font-bold text-slate-900 dark:text-white">{title || <span className="muted">Name not known yet</span>}</h2>
          {badges}
        </div>
        {meta && <div className="text-sm text-slate-500">{meta}</div>}
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([label, value, options = {}]) => (
          <div key={label} className={`min-w-0 ${options.wide ? "sm:col-span-2" : ""}`}>
            <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">
              {value === null || value === undefined || value === "" ? <span className="font-normal text-slate-400">N/A</span> : value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  );
}
