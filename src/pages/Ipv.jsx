import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, downloadExport } from "../lib/api";
import { fmtDateTime12, fmtDuration, IPV_STATUS_LABELS } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";
import { CopyButton, Empty, ErrorBox, Pagination, SearchInput, StatusBadge, TypeBadge, useLoader } from "../components/ui";
import { DownloadIcon } from "../components/icons";

const DEFAULTS = { search: "", type: "", status: "", from: "", to: "", page: 1, pageSize: 25 };
const NA = <span className="muted">N/A</span>;

export default function Ipv() {
  const navigate = useNavigate();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const [exportError, setExportError] = useState(null);
  const { data, error, loading, reload } = useLoader(() => api.get("/ipv", filters), [JSON.stringify(filters)]);

  const exportCsv = async () => {
    setExportError(null);
    try {
      await downloadExport("/ipv/export", { ...filters, page: undefined, pageSize: undefined });
    } catch (err) {
      setExportError(err);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SearchInput className="lg:col-span-2" value={filters.search} onChange={(search) => setFilters({ search })} placeholder="Search Name, PAN, Email, RM, ID…" />
          <select className="input" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}>
            <option value="">NRI (all)</option><option value="NRE">NRE</option><option value="NRO">NRO</option><option value="UNLINKED">PAN not verified yet</option>
          </select>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All Statuses</option>
            {Object.entries(IPV_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} title="Requested from" />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} title="Requested to" />
        </div>
        <div className="mt-3">
          <button type="button" className="btn-primary" onClick={exportCsv}><DownloadIcon className="h-4 w-4" /> Export</button>
        </div>
        {exportError && <div className="mt-3"><ErrorBox error={exportError} /></div>}
      </div>

      <ErrorBox error={error} onRetry={reload} />

      {data && (
        <div className={`card overflow-hidden ${loading ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr>{["Requested", "IPV ID", "Account Type", "Client Name", "PAN Number", "Client Email", "RM", "Status", "Duration"].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.id} className="table-row cursor-pointer" onClick={() => navigate(`/ipv/${r.id}`)}>
                    <td className="td">{fmtDateTime12(r.requested_at)}</td>
                    <td className="td">{r.id}</td>
                    <td className="td"><TypeBadge type={r.account_type} /></td>
                    <td className="td">{r.client_name || NA}</td>
                    <td className="td">{r.pan_number ? <span className="inline-flex items-center">{r.pan_number}<CopyButton value={r.pan_number} /></span> : NA}</td>
                    <td className="td">{r.client_email || NA}</td>
                    <td className="td">{r.rm_email || NA}</td>
                    <td className="td"><StatusBadge value={r.status} label={IPV_STATUS_LABELS[r.status]} /></td>
                    <td className="td">{r.duration_seconds !== null ? fmtDuration(r.duration_seconds) : NA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.rows.length && <Empty />}
          <Pagination page={filters.page} pageSize={filters.pageSize} total={data.total} onPage={(page) => setFilters({ page })} onPageSize={(pageSize) => setFilters({ pageSize })} />
        </div>
      )}
    </div>
  );
}
