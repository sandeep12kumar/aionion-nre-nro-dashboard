import { useState } from "react";
import { Link } from "react-router-dom";
import { api, downloadExport } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fmtDateTime, fmtMoney, SCHEME_LABELS, STATUS_LABELS } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";
import { Badge, Drawer, Empty, ErrorBox, Loading, Pagination, SearchInput, StatCard, StatusBadge, TypeBadge, useLoader } from "../components/ui";
import { DownloadIcon } from "../components/icons";

const DEFAULTS = { search: "", type: "", status: "", from: "", to: "", page: 1, pageSize: 25, sort: "payment_date", dir: "desc" };

function PaymentDrawer({ pan, onClose }) {
  const { can } = useAuth();
  const { data, error, loading } = useLoader(() => (pan ? api.get(`/payments/client/${pan}`) : Promise.resolve(null)), [pan]);
  const c = data?.client;
  const Item = ({ label, children }) => (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{children || <span className="muted">N/A</span>}</p>
    </div>
  );
  return (
    <Drawer open={Boolean(pan)} onClose={onClose}>
      {loading && !data ? <Loading /> : error ? <ErrorBox error={error} /> : c && (
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{c.client_name || c.pan_number}</h2>
              <p className="text-sm text-slate-500">{c.kyc_type} · {c.pan_number}</p>
            </div>
            <button type="button" className="btn-outline btn-sm" onClick={onClose}>Close</button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Item label="PAN">{c.pan_number}</Item>
            <Item label="Mobile">{c.mobile}</Item>
            <Item label="Email">{c.registered_email}</Item>
            <Item label="RM email">{c.rm_email}</Item>
            <Item label="Client code">{c.client_code}</Item>
            <Item label="Scheme">{c.scheme_key ? `${SCHEME_LABELS[c.scheme_key] || c.scheme_key} · ${fmtMoney(c.scheme_total_amount)}` : null}</Item>
            <Item label="Application status">{STATUS_LABELS[c.application_status] || c.application_status}</Item>
          </div>
          {can("clients") && <Link to={`/clients/${c.pan_number}`} className="link mt-4 inline-block text-sm">Open client details →</Link>}

          <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">All attempts ({data.attempts.length})</p>
          <div className="space-y-3">
            {data.attempts.map((a) => (
              <div key={a.txn_key} className={`rounded-xl border p-4 ${a.status === "success" ? "border-primary-400 dark:border-primary-500/50" : "border-slate-200 dark:border-slate-700"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{a.txn_key}</span>
                  <span className="flex gap-1">{a.is_test && <Badge tone="pink">Test</Badge>}<StatusBadge value={a.status} /></span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Item label="Amount">{fmtMoney(a.amount)}</Item>
                  <Item label="Payment method">{a.payment_method}</Item>
                  <Item label="Razorpay payment ID">{a.razorpay_payment_id}</Item>
                  <Item label="Initiated">{fmtDateTime(a.initiated_at)}</Item>
                  <Item label="Updated">{fmtDateTime(a.updated_at)}</Item>
                </div>
                {a.raw_response && (
                  <details className="mt-2">
                    <summary className="link cursor-pointer text-sm">Raw Razorpay response</summary>
                    <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">{JSON.stringify(a.raw_response, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Payments() {
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const [drawerPan, setDrawerPan] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const { data, error, loading, reload } = useLoader(() => api.get("/payments", filters), [JSON.stringify(filters)]);
  const s = data?.summary;

  const exportCsv = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await downloadExport("/payments/export", { ...filters, page: undefined, pageSize: undefined });
    } catch (err) {
      setExportError(err);
    } finally {
      setExporting(false);
    }
  };
  const sortBy = (key) => setFilters({ sort: key, dir: filters.sort === key && filters.dir === "desc" ? "asc" : "desc" });
  const Th = ({ k, children }) => (
    <th className={`th ${k ? "cursor-pointer select-none hover:text-primary-600" : ""}`} onClick={k ? () => sortBy(k) : undefined}>
      {children}{k && filters.sort === k ? (filters.dir === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

  return (
    <div className="space-y-5">
      {s ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total transactions" value={s.total.count} sub={fmtMoney(s.total.amount)} active={!filters.status} onClick={() => setFilters({ status: "" })} />
          <StatCard label="Successful transactions" value={s.success.count} sub={fmtMoney(s.success.amount)} tone="green" active={filters.status === "success"} onClick={() => setFilters({ status: "success" })} />
          <StatCard label="Pending transactions" value={s.pending.count} sub={fmtMoney(s.pending.amount)} tone="amber" active={filters.status === "pending"} onClick={() => setFilters({ status: "pending" })} />
          <StatCard label="Failed transactions" value={s.failed.count} sub={fmtMoney(s.failed.amount)} tone="red" active={filters.status === "failed"} onClick={() => setFilters({ status: "failed" })} />
        </div>
      ) : loading ? <Loading /> : null}

      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <SearchInput className="lg:col-span-2" value={filters.search} onChange={(search) => setFilters({ search })}
            placeholder="Search Name, PAN, Mobile, Email, RM, Transaction ID…" />
          <select className="input" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })}>
            <option value="">NRI (all)</option><option value="NRE">NRE</option><option value="NRO">NRO</option>
          </select>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>
            <option value="">All Statuses</option><option value="success">Success</option><option value="pending">Pending</option><option value="failed">Failed</option>
          </select>
          <input type="date" className="input" value={filters.from} onChange={(e) => setFilters({ from: e.target.value })} title="Paid from" />
          <input type="date" className="input" value={filters.to} onChange={(e) => setFilters({ to: e.target.value })} title="Paid to" />
        </div>
        <div className="mt-3">
          <button type="button" className="btn-primary" onClick={exportCsv} disabled={exporting}>
            <DownloadIcon className="h-4 w-4" /> {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
        {exportError && <div className="mt-3"><ErrorBox error={exportError} /></div>}
      </div>

      <ErrorBox error={error} onRetry={reload} />

      {data && (
        <div className={`card overflow-hidden ${loading ? "opacity-60" : ""}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr>
                  <Th k="client_name">Client Name</Th><Th>Mobile Number</Th><Th k="kyc_type">KYC Type</Th><Th>Transaction ID</Th>
                  <Th k="amount">Amount</Th><Th k="payment_date">Payment Date</Th><Th k="status">Status</Th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.txn_key} className="table-row cursor-pointer" onClick={() => setDrawerPan(r.pan_number)}>
                    <td className="td font-medium">{r.client_name}</td>
                    <td className="td">{r.mobile || <span className="muted">N/A</span>}</td>
                    <td className="td"><TypeBadge type={r.kyc_type} /></td>
                    <td className="td">
                      <span className="block font-mono text-xs text-slate-700 dark:text-slate-200">{r.txn_key}</span>
                      {r.razorpay_payment_id && <span className="block font-mono text-xs text-slate-400">{r.razorpay_payment_id}</span>}
                    </td>
                    <td className="td font-semibold">{fmtMoney(r.amount)}</td>
                    <td className="td">{fmtDateTime(r.payment_date)}</td>
                    <td className="td"><span className="flex gap-1"><StatusBadge value={r.status} />{r.is_test && <Badge tone="pink">Test</Badge>}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.rows.length && <Empty />}
          <Pagination page={filters.page} pageSize={filters.pageSize} total={data.total} onPage={(page) => setFilters({ page })} onPageSize={(pageSize) => setFilters({ pageSize })} />
        </div>
      )}
      <PaymentDrawer pan={drawerPan} onClose={() => setDrawerPan(null)} />
    </div>
  );
}
