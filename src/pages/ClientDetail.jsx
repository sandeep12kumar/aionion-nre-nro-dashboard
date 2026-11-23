import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { fmtDateTime, fmtDuration, IPV_STATUS_LABELS, STATUS_LABELS, titleCase } from "../lib/format";
import DetailSections from "../components/DetailSections";
import { DocumentsPanel, PreviewPanel, useFilePreview } from "../components/FileViewer";
import { CopyButton, ErrorBox, Loading, StatusBadge, SummaryCard, TypeBadge, useLoader } from "../components/ui";

const PREFERENCES = [
  "depository_credit_instruction", "pledge_instruction", "account_statement_requirement", "electronic_transaction_statement",
  "share_email_with_rta", "annual_report_preference", "dividend_interest_ecs", "contract_note_preference",
  "trust_facility_instruction", "dis_at_account_opening",
];

// [title, test(key)] in display order; the first match wins, the rest go to "Logs & Raw Data".
const GROUPS = [
  ["Application", (k) => ["id", "unique_id", "kyc_type", "pan_number", "account_type", "application_status", "current_step", "stage_key",
    "client_name", "rm_email", "rm_login_verified_at", "has_aadhaar", "created_at", "updated_at"].includes(k)],
  ["Contact", (k) => ["registered_email", "mobile"].includes(k) || k.startsWith("email_otp_")],
  ["PAN / ITR", (k) => k === "date_of_birth" || k.startsWith("itr_") && k !== "itr_raw_response" || k.startsWith("techexcel_") || k === "category_type" || k.startsWith("pan_card_")],
  ["Personal & FATCA", (k) => k.startsWith("personal_")],
  ["Aadhaar / DigiLocker", (k) => (k.startsWith("aadhaar_") && k !== "aadhaar_raw_response") || (k.startsWith("digilocker_") && k !== "digilocker_logs")],
  ["Bank", (k) => k.startsWith("bank_") && k !== "bank_verification_logs"],
  ["PIS", (k) => k.startsWith("pis_")],
  ["Indian ID / Address", (k) => k.startsWith("local_id_")],
  ["Foreign ID / Address", (k) => k.startsWith("foreign_id_")],
  ["Account Preferences", (k) => PREFERENCES.includes(k)],
  ["Nominees", (k) => /^nominee\d_/.test(k)],
  ["Scheme & Payment", (k) => k.startsWith("scheme_") || (k.startsWith("payment_") ) || k.startsWith("client_code") || k === "boid"],
  ["Client Link", (k) => k.startsWith("client_link_")],
  ["Live Photo & Signature", (k) => k.startsWith("live_photo_") || k.startsWith("signature_")],
  ["eSign & PDF", (k) => k.startsWith("esign_") && k !== "esign_logs" || k.startsWith("application_pdf_")],
];

function groupFields(row) {
  const groups = GROUPS.map(([title]) => ({ title, fields: [] }));
  const raw = { title: "Logs & Raw Data", fields: [] };
  for (const [key, value] of Object.entries(row)) {
    const index = GROUPS.findIndex(([, test]) => test(key));
    (index === -1 ? raw : groups[index]).fields.push([key, value]);
  }
  return [raw, ...groups].filter((g) => g.fields.length);
}

export default function ClientDetail() {
  const { pan } = useParams();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useLoader(() => api.get(`/clients/${encodeURIComponent(pan)}`), [pan]);
  const viewer = useFilePreview(`/clients/${encodeURIComponent(pan)}/files`);
  const sections = useMemo(() => (data ? groupFields(data.client) : []), [data]);

  if (loading && !data) return <Loading />;
  if (error) return <div className="space-y-3"><button type="button" className="link text-sm" onClick={() => navigate(-1)}>← Back</button><ErrorBox error={error} onRetry={reload} /></div>;
  const c = data.client;
  const appFiles = data.files.filter((f) => f.source === "application");
  const ipvFiles = data.files.filter((f) => f.source === "ipv");

  return (
    <div className="space-y-5">
      <button type="button" className="link text-sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/clients"))}>← Back to Clients</button>
      <SummaryCard
        title={c.client_name}
        badges={<><TypeBadge type={c.kyc_type} /><StatusBadge value={c.application_status} label={STATUS_LABELS[c.application_status]} /></>}
        meta={<>Unique ID <span className="font-semibold text-slate-800 dark:text-slate-100">{c.unique_id}</span></>}
        items={[
          ["PAN", <span className="inline-flex items-center">{c.pan_number}<CopyButton value={c.pan_number} /></span>],
          ["Client code", c.client_code ? <span className="inline-flex items-center">{c.client_code}<CopyButton value={c.client_code} /></span> : null],
          ["BOID", c.boid ? <span className="inline-flex items-center">{c.boid}<CopyButton value={c.boid} /></span> : null],
          ["Applied on", fmtDateTime(c.created_at)],
          ["Stage", data.stageLabel],
          ["Current step", c.current_step ? titleCase(c.current_step) : null],
          ["RM", c.rm_email, { wide: true }],
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <DetailSections title={`${c.kyc_type} Application`} sections={sections} />
        <div>
          <DocumentsPanel viewer={viewer} groups={[{ title: `${c.kyc_type} documents`, files: appFiles }, { title: "IPV documents", files: ipvFiles }]} />
        </div>
        <PreviewPanel viewer={viewer} />
      </div>

      <div className="card overflow-hidden">
        <p className="px-5 py-3 text-sm font-semibold">IPV Video Verification <span className="ml-1 text-xs text-slate-400">{data.ipv.length}</span></p>
        {data.ipv.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40"><tr>
                {["IPV ID", "Requested", "Call started", "Duration", "RM", "Status", ""].map((h) => <th key={h} className="th">{h}</th>)}
              </tr></thead>
              <tbody>
                {data.ipv.map((i) => (
                  <tr key={i.id} className="table-row">
                    <td className="td">{i.id}</td>
                    <td className="td">{fmtDateTime(i.requestedAt)}</td>
                    <td className="td">{fmtDateTime(i.startedAt)}</td>
                    <td className="td">{i.startedAt ? fmtDuration((new Date(i.endedAt || Date.now()) - new Date(i.startedAt)) / 1000) : "N/A"}</td>
                    <td className="td">{i.rmEmail || "N/A"}</td>
                    <td className="td"><StatusBadge value={i.status} label={IPV_STATUS_LABELS[i.status]} /></td>
                    <td className="td"><Link to={`/ipv/${i.id}`} className="link text-sm">Open IPV →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 pb-5 text-sm text-slate-400">No video IPV is linked to this PAN.</p>}
      </div>

      <div className="card overflow-hidden">
        <p className="px-5 py-3 text-sm font-semibold">BOID <span className="ml-1 text-xs text-slate-400">{data.boids.length}</span></p>
        {data.boids.length ? (
          <table className="min-w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40"><tr>{["BOID", "Status", "Assigned at"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {data.boids.map((b) => (
                <tr key={b.boid} className="table-row">
                  <td className="td"><span className="inline-flex items-center">{b.boid}<CopyButton value={b.boid} /></span></td>
                  <td className="td">{b.status}</td>
                  <td className="td">{fmtDateTime(b.assigned_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="px-5 pb-5 text-sm text-slate-400">No BOID is assigned to this PAN.</p>}
      </div>
    </div>
  );
}
