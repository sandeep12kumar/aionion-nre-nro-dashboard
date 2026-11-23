import { useState } from "react";
import { api, downloadExport } from "../lib/api";
import { fmtDateTime } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";
import { Badge, Empty, ErrorBox, Pagination, SearchInput, useLoader } from "../components/ui";
import { DownloadIcon } from "../components/icons";

const DEFAULTS = { user: "", action: "", search: "", from: "", to: "", page: 1, pageSize: 50 };
const TONES = {
  login: "green", logout: "slate", login_failed: "red",
  password_changed: "amber", password_reset: "amber", user_created: "violet", user_updated: "violet", boid_upload: "violet",
};

// Who did what on the dashboard (Super Admin).
export default function AuditLogs() {
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const [exportError, setExportError] = useState(null);
  const { data, error, loading, reload } = useLoader(() => api.get("/audit", filters), [JSON.stringify(filters)]);

  const exportCsv = async () => {
    setExportError(null);
    try {
      await downloadExport("/audit/export", { ...filters, page: undefined, pageSize: undefined });
    } catch (err) {
      setExportError(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput value={filters.user} onChange={(user) => setFilters({ user })} placeholder="User" />
          <select className="input" value={filters.action} onChange={(e) => setFilters({ action: e.target.value })}>
            <option value="">All actions</option>
            {(data?.actions || []).map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
          <SearchInput value={filters.search} onChange={(search) => setFilters({ search })} placeholder="PAN, file, IP, details…" />
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} title="From" />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} title="To" />
        </div>
        <div className="mt-3"><button type="button" className="btn-primary" onClick={exportCsv}><DownloadIcon className="h-4 w-4" /> Export</button></div>
        {exportError && <div className="mt-3"><ErrorBox error={exportError} /></div>}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {data && (
        <div className={`card overflow-hidden ${loading ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr>{["Time", "User", "Action", "Target", "Details", "IP"].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const details = r.details ? JSON.stringify(r.details) : "";
                  return (
                    <tr key={r.id} className="table-row">
                      <td className="td">{fmtDateTime(r.created_at)}</td>
                      <td className="td">{r.username || <span className="muted">—</span>}</td>
                      <td className="td"><Badge tone={TONES[r.action] || "slate"}>{r.action.replace(/_/g, " ")}</Badge></td>
                      <td className="td">{r.target || <span className="muted">—</span>}</td>
                      <td className="td max-w-md truncate text-xs text-slate-500" title={details}>{details || "—"}</td>
                      <td className="td text-xs" title={r.user_agent || ""}>{r.ip || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!data.rows.length && <Empty />}
          <Pagination page={filters.page} pageSize={filters.pageSize} total={data.total} sizes={[50, 100, 200]}
            onPage={(page) => setFilters({ page })} onPageSize={(pageSize) => setFilters({ pageSize })} />
        </div>
      )}
    </div>
  );
}
