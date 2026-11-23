import { useMemo, useState } from "react";
import { fmtValue, titleCase } from "../lib/format";
import { ChevronIcon } from "./icons";

// Collapsible groups of "label: value" fields with a filter box.
// sections: [{ title, fields: [[key, value], ...], open? }]
export default function DetailSections({ title, sections }) {
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(() => Object.fromEntries(sections.map((s) => [s.title, Boolean(s.open)])));
  const term = filter.trim().toLowerCase();

  const visible = useMemo(() => sections.map((s) => ({
    ...s,
    fields: term
      ? s.fields.filter(([key, value]) => titleCase(key).toLowerCase().includes(term) || fmtValue(value, key).toLowerCase().includes(term))
      : s.fields,
  })).filter((s) => !term || s.fields.length), [sections, term]);

  return (
    <div className="card overflow-hidden">
      <div className="bg-violet-50 px-4 py-3 text-center text-sm font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{title}</div>
      <div className="p-3">
        <input className="input !h-10" placeholder="Find a field or value…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {visible.map((section) => {
          const isOpen = term ? true : open[section.title];
          return (
            <div key={section.title}>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [section.title]: !o[section.title] }))}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/50"
              >
                <span>
                  {section.title}
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{section.fields.length}</span>
                </span>
                <ChevronIcon className={`h-4 w-4 text-slate-400 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <dl className="space-y-3 bg-slate-50/60 px-4 py-3 dark:bg-slate-950/30">
                  {section.fields.map(([key, value]) => <FieldValue key={key} name={key} value={value} />)}
                </dl>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldValue({ name, value }) {
  const isJson = value !== null && typeof value === "object";
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <dt className="text-xs text-slate-500">{titleCase(name)}</dt>
      {isJson ? (
        <dd className="mt-0.5">
          <button type="button" className="link text-xs" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide" : `Show (${Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} keys`})`}
          </button>
          {expanded && (
            <pre className="mt-1 max-h-80 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(value, null, 2)}</pre>
          )}
        </dd>
      ) : typeof value === "string" && value.length > 300 ? (
        // very long text (e.g. the Aadhaar photo as base64): folded
        <dd className="mt-0.5">
          <button type="button" className="link text-xs" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Hide" : `Show (${value.length.toLocaleString("en-IN")} characters)`}
          </button>
          {expanded && <p className="mt-1 max-h-60 overflow-auto break-all rounded-lg bg-slate-100 p-2 font-mono text-xs dark:bg-slate-800">{value}</p>}
        </dd>
      ) : (
        <dd className="mt-0.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{fmtValue(value, name)}</dd>
      )}
    </div>
  );
}
