import { useRef, useState } from "react";
import readXlsxFile from "read-excel-file";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fmtDateTime } from "../lib/format";
import { useUrlFilters } from "../lib/useUrlFilters";
import { Badge, CopyButton, Empty, ErrorBox, Loading, Pagination, SearchInput, StatCard, useLoader } from "../components/ui";
import { UploadIcon } from "../components/icons";

const DEFAULTS = { status: "", search: "", page: 1, pageSize: 25 };
const MAX_ROWS = 20000;

// Reads the BOID column (headed "BOID", else the first column) of an .xlsx /
// .csv file. Excel keeps only 15 digits of a NUMBER, so a 16-digit BOID typed
// as a number is already wrong in the file: those cells are reported, not sent.
async function readBoids(file) {
  let rows;
  if (/\.csv$/i.test(file.name)) {
    const text = await file.text();
    rows = text.split(/\r?\n/).map((line) => line.split(",").map((v) => v.trim().replace(/^"|"$/g, "")));
  } else if (/\.xlsx$/i.test(file.name)) {
    rows = await readXlsxFile(file);
  } else {
    throw new Error("Choose an .xlsx or .csv file.");
  }
  rows = rows.filter((r) => r.some((v) => v !== null && v !== ""));
  if (!rows.length) throw new Error("The file is empty.");
  const header = rows[0].map((v) => String(v ?? "").trim().toLowerCase());
  let column = header.findIndex((h) => h === "boid" || h === "bo id" || h === "boid number");
  const hasHeader = column !== -1 || !/^\d+$/.test(header[0] || "");
  if (column === -1) column = 0;
  const body = hasHeader ? rows.slice(1) : rows;
  if (body.length > MAX_ROWS) throw new Error(`At most ${MAX_ROWS} rows per file.`);
  const numeric = [];
  const values = body.map((r, i) => {
    const v = r[column];
    if (typeof v === "number") {
      numeric.push(i + (hasHeader ? 2 : 1));
      return "";
    }
    return String(v ?? "").trim();
  });
  return { values, numeric };
}

function Uploader({ onDone }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const choose = (f) => {
    setFile(f || null);
    setError("");
    setResult(null);
  };

  const upload = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { values, numeric } = await readBoids(file);
      const response = await api.post("/boid/upload", { boids: values.filter(Boolean), fileName: file.name });
      setResult({ ...response, numeric });
      setFile(null);
      if (input.current) input.current.value = "";
      onDone();
    } catch (err) {
      setError(err.message);
      if (err.body?.invalid) setResult({ invalid: err.body.invalid, invalidCount: err.body.invalidCount, failed: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card max-w-3xl">
      <div className="flex items-start gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-500/15"><UploadIcon /></span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">NRI BOID Upload</p>
          <p className="text-sm text-slate-500">Add new BOIDs to the NRE - NRO stock (nre_nro.boid_numbers) from an Excel or CSV file</p>
        </div>
      </div>
      <div className="p-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer.files?.[0]); }}
          className={`rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10" : "border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-800/30"}`}
        >
          <UploadIcon className="mx-auto h-6 w-6 text-primary-500" />
          <p className="mt-2 text-sm">
            <button type="button" className="link" onClick={() => input.current?.click()}>Click to choose</button> or drag a file here
          </p>
          <p className="mt-1 text-xs text-slate-500">.xlsx or .csv, up to {MAX_ROWS.toLocaleString("en-IN")} rows</p>
          {file && <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">{file.name}</p>}
          <input ref={input} type="file" accept=".xlsx,.csv" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>One BOID per row, in a column headed <b>BOID</b> (or the first column).</li>
          <li>Each BOID must be exactly 16 digits. Format the column as <b>Text</b> in Excel.</li>
          <li>Valid new BOIDs are added as <b>AVAILABLE</b>; duplicates are skipped.</li>
        </ul>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        {result && !result.failed && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            <p className="font-semibold">{result.added} new BOID(s) added.</p>
            <p>{result.alreadyExisting} already in stock · {result.repeatedInFile} repeated in the file · {result.invalidCount} invalid</p>
          </div>
        )}
        {result?.numeric?.length > 0 && (
          <p className="mt-3 text-sm text-amber-600">
            {result.numeric.length} row(s) were Excel numbers, not text, so their last digit may be lost — they were skipped (rows {result.numeric.slice(0, 15).join(", ")}{result.numeric.length > 15 ? "…" : ""}). Format the column as Text, retype them and upload again.
          </p>
        )}
        {result?.invalid?.length > 0 && (
          <p className="mt-2 text-sm text-red-500">
            Invalid: {result.invalid.slice(0, 10).map((x) => `row ${x.row} "${x.value}"`).join(", ")}{result.invalidCount > 10 ? ` and ${result.invalidCount - 10} more` : ""}
          </p>
        )}
        <div className="mt-5 flex justify-end">
          <button type="button" className="btn-primary" disabled={!file || busy} onClick={upload}>{busy ? "Uploading…" : "Upload BOIDs"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Boid() {
  const { user } = useAuth();
  const [filters, setFilters] = useUrlFilters(DEFAULTS);
  const { data, error, loading, reload } = useLoader(() => api.get("/boid", filters), [JSON.stringify(filters)]);
  const s = data?.summary;
  const canUpload = ["super_admin", "admin"].includes(user?.role);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">BOID</h2>
      {s ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Accounts" value={s.total} active={!filters.status} onClick={() => setFilters({ status: "" })} />
            <StatCard label="Used" value={s.used} tone="red" active={filters.status === "ASSIGNED"} onClick={() => setFilters({ status: "ASSIGNED" })} />
            <StatCard label="Available" value={s.available} tone={s.low ? "red" : "green"} active={filters.status === "AVAILABLE"} onClick={() => setFilters({ status: "AVAILABLE" })} />
          </div>
          <p className={`-mt-3 text-sm ${s.low ? "font-medium text-red-500" : "text-slate-500"}`}>{s.low ? `Low stock — alert below ${s.alertBelow}` : `Alert below ${s.alertBelow}`}</p>
        </>
      ) : loading && <Loading />}

      {canUpload && <Uploader onDone={reload} />}

      <ErrorBox error={error} onRetry={reload} />
      {data && (
        <div className={`card overflow-hidden ${loading ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <SearchInput className="max-w-sm" value={filters.search} onChange={(search) => setFilters({ search })} placeholder="Search BOID or PAN" />
            <select className="input !w-auto" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })}>
              <option value="">All</option><option value="AVAILABLE">Available</option><option value="ASSIGNED">Assigned</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40"><tr>{["BOID", "Status", "PAN", "Assigned at"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((b) => {
                  const assigned = b.status === "ASSIGNED" || b.pan_number;
                  return (
                    <tr key={b.boid} className="table-row">
                      <td className="td font-mono"><span className="inline-flex items-center">{b.boid}<CopyButton value={b.boid} /></span></td>
                      <td className="td"><Badge tone={assigned ? "violet" : "green"}>{assigned ? "Assigned" : "Available"}</Badge></td>
                      <td className="td">{b.pan_number || <span className="muted">—</span>}</td>
                      <td className="td">{b.assigned_at ? fmtDateTime(b.assigned_at) : <span className="muted">—</span>}</td>
                    </tr>
                  );
                })}
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
