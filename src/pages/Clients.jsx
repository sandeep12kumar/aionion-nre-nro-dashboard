import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, downloadExport } from "../lib/api";
import { fmtDate, fmtDateTime, fmtValue, STATUS_LABELS } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";
import { Badge, CopyButton, Empty, ErrorBox, Pagination, SearchInput, StatusBadge, TypeBadge, useLoader } from "../components/ui";
import { ChevronIcon, DownloadIcon } from "../components/icons";

const DEFAULTS = { search: "", type: "", status: "", stage: "", from: "", to: "", page: 1, pageSize: 25, sort: "created_at", dir: "desc" };
const COLUMNS_KEY = "nri_dash_client_columns";
const COPY = new Set(["pan_number", "client_code", "mobile", "boid", "unique_id"]);
const STAGE_TONES = { esigned: "green", submitted: "green", yet_to_esign: "violet", yet_to_submit: "violet", payment: "amber", live_photo: "amber" };
const SORTABLE = new Set(["created_at", "updated_at", "unique_id", "client_name", "pan_number", "kyc_type", "stage_key", "application_status"]);

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(COLUMNS_KEY) || "null");
  } catch {
    return null;
  }
};

function ColumnPicker({ available, chosen, onChange }) {
  const [open, setOpen] = useState(false);
  const [find, setFind] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const shown = available.filter((c) => !find || c.label.toLowerCase().includes(find.toLowerCase()) || c.key.includes(find.toLowerCase()));
  const toggle = (key) => onChange(chosen.includes(key) ? chosen.filter((k) => k !== key) : [...chosen, key]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="btn-outline w-full justify-between" onClick={() => setOpen((o) => !o)}>
        Columns ({chosen.length}/{available.length}) <ChevronIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-80 p-3">
          <input className="input !h-9" placeholder="Find a column…" value={find} onChange={(e) => setFind(e.target.value)} />
          <div className="mt-2 flex gap-3 text-xs">
            <button type="button" className="link" onClick={() => onChange(available.filter((c) => c.default).map((c) => c.key))}>Default</button>
            <button type="button" className="link" onClick={() => onChange(["pan_number"])}>Clear</button>
          </div>
          <div className="mt-2 max-h-80 space-y-0.5 overflow-y-auto">
            {shown.map((c) => (
              <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <input type="checkbox" className="accent-violet-600" checked={chosen.includes(c.key)} disabled={c.key === "pan_number"} onChange={() => toggle(c.key)} />
                <span className="truncate">{c.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Clients() {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const [meta, setMeta] = useState(null);
  const [chosen, setChosen] = useState(loadSaved);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    api.get("/clients/columns").then((data) => {
      setMeta(data);
      setChosen((current) => {
        const known = new Set(data.columns.map((c) => c.key));
        const valid = (current || []).filter((k) => known.has(k));
        return valid.length ? valid : data.columns.filter((c) => c.default).map((c) => c.key);
      });
    }).catch(() => setMeta({ columns: [], stages: [] }));
  }, []);

  const saveColumns = (keys) => {
    const list = keys.includes("pan_number") ? keys : [...keys, "pan_number"];
    setChosen(list);
    try {
      localStorage.setItem(COLUMNS_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  };

  const params = useMemo(() => ({ ...filters, columns: chosen || undefined }), [filters, chosen]);
  const ready = Boolean(meta && chosen);
  const list = useLoader(() => (ready ? api.get("/clients", params) : Promise.resolve(null)), [ready, JSON.stringify(params)]);
  const counts = useLoader(
    () => api.get("/clients/stage-counts", { search: filters.search, type: filters.type, status: filters.status, from: filters.from, to: filters.to }),
    [filters.search, filters.type, filters.status, filters.from, filters.to],
  );
  const stageLabels = Object.fromEntries((meta?.stages || []).map((s) => [s.key, s.label]));

  const exportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadExport("/clients/export", { ...filters, page: undefined, pageSize: undefined, columns: chosen });
    } catch (err) {
      setExportError(err);
    } finally {
      setExporting(false);
    }
  };

  const sortBy = (key) => {
    if (!SORTABLE.has(key)) return;
    setFilters({ sort: key, dir: filters.sort === key && filters.dir === "desc" ? "asc" : "desc" });
  };

  const cell = (key, row) => {
    const value = row[key];
    if (key === "created_at") return fmtDate(value);
    if (key === "kyc_type") return <TypeBadge type={value} />;
    if (key === "stage_key") return value ? <Badge tone={STAGE_TONES[value] || "blue"}>{stageLabels[value] || value}</Badge> : <span className="muted">N/A</span>;
    if (key === "application_status") return <StatusBadge value={value} label={STATUS_LABELS[value]} />;
    if (["payment_state", "esign_status"].includes(key)) return <StatusBadge value={value} />;
    if (value === null || value === undefined || value === "") return <span className="muted">N/A</span>;
    if (COPY.has(key)) return <span className="inline-flex items-center">{value}<CopyButton value={value} /></span>;
    if (/_at$/.test(key)) return fmtDateTime(value);
    const text = fmtValue(value, key);
    return text.length > 60 ? <span title={text}>{text.slice(0, 60)}…</span> : text;
  };

  const columns = list.data?.columns || (meta?.columns || []).filter((c) => chosen?.includes(c.key));
  const rows = list.data?.rows || [];

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          <SearchInput className="2xl:col-span-2" value={filters.search} onChange={(search) => setFilters({ search })} placeholder="Search Name, PAN, Email, Mobile, ID, Client code, BOID…" />
          <select className="input" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}>
            <option value="">NRI (NRE + NRO)</option>
            <option value="NRE">NRE</option>
            <option value="NRO">NRO</option>
          </select>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select className="input" value={filters.stage} onChange={(e) => setFilters({ stage: e.target.value })}>
            <option value="">All Stages{counts.data ? ` (${counts.data.total})` : ""}</option>
            {(meta?.stages || []).map((s) => (
              <option key={s.key} value={s.key}>{s.label}{counts.data ? ` (${counts.data.counts[s.key] || 0})` : ""}</option>
            ))}
          </select>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} title="Applied from" />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} title="Applied to" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" onClick={exportCsv} disabled={exporting}>
            <DownloadIcon className="h-4 w-4" /> {exporting ? "Exporting…" : "Export"}
          </button>
          {meta && chosen && <div className="w-56"><ColumnPicker available={meta.columns} chosen={chosen} onChange={saveColumns} /></div>}
          {Object.entries(filters).some(([k, v]) => !["page", "pageSize", "sort", "dir"].includes(k) && v) && (
            <button type="button" className="link text-sm" onClick={() => setFilters({ search: "", type: "", status: "", stage: "", from: "", to: "" })}>Clear filters</button>
          )}
        </div>
        {exportError && <div className="mt-3"><ErrorBox error={exportError} /></div>}
      </div>

      <ErrorBox error={list.error} onRetry={list.reload} />

      <div className={`card overflow-hidden ${list.loading ? "opacity-60" : ""}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`th ${SORTABLE.has(c.key) ? "cursor-pointer select-none hover:text-violet-600" : ""}`} onClick={() => sortBy(c.key)}>
                    {c.label}{filters.sort === c.key ? (filters.dir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.kyc_type}-${row.pan_number}`} className="table-row cursor-pointer" onClick={() => navigate(`/clients/${row.pan_number}`)}>
                  {columns.map((c) => <td key={c.key} className="td">{cell(c.key, row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.loading && list.data && !rows.length && <Empty />}
        {list.data && (
          <Pagination page={filters.page} pageSize={filters.pageSize} total={list.data.total}
            onPage={(page) => setFilters({ page })} onPageSize={(pageSize) => setFilters({ pageSize })} />
        )}
      </div>
    </div>
  );
}
