import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fmtDateTime12, fmtDuration, IPV_STATUS_LABELS } from "../lib/format";
import DetailSections from "../components/DetailSections";
import { DocumentsPanel, PreviewPanel, useFilePreview } from "../components/FileViewer";
import { ErrorBox, Loading, StatusBadge, SummaryCard, TypeBadge, useLoader } from "../components/ui";

const GROUPS = [
  ["Video Session", (k) => ["id", "status", "requested_at", "token_expires_at", "rm_joined_at", "client_joined_at", "started_at", "ended_at", "duration_seconds", "rm_email", "rm_remarks"].includes(k)],
  ["Client & Location", (k) => ["client_name", "client_email", "pan_number", "account_type"].includes(k) || k.startsWith("client_")],
  ["Document Details", (k) => k.startsWith("passport_") || k.startsWith("pan_card_")],
];

function groupFields(row) {
  const groups = GROUPS.map(([title]) => ({ title, fields: [] }));
  const raw = { title: "Logs & Raw Data", fields: [] };
  for (const [key, value] of Object.entries(row)) {
    const index = GROUPS.findIndex(([, test]) => test(key));
    (index === -1 ? raw : groups[index]).fields.push([key, value]);
  }
  return [raw, ...groups].filter((g) => g.fields.length).map((g) => ({ ...g, open: g.title === "Video Session" }));
}

export default function IpvDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data, error, loading, reload } = useLoader(() => api.get(`/ipv/${id}`), [id]);
  const viewer = useFilePreview(`/ipv/${id}/files`);
  const sections = useMemo(() => (data ? groupFields(data.ipv) : []), [data]);

  if (loading && !data) return <Loading />;
  if (error) return <div className="space-y-3"><button type="button" className="link text-sm" onClick={() => navigate(-1)}>← Back</button><ErrorBox error={error} onRetry={reload} /></div>;
  const i = data.ipv;
  const recordings = data.files.filter((f) => f.id.includes(".recording."));
  const others = data.files.filter((f) => !f.id.includes(".recording."));

  const pan = i.pan_number
    ? (can("clients") ? <Link className="link" to={`/clients/${i.pan_number}`}>{i.pan_number}</Link> : i.pan_number)
    : <span className="font-normal text-slate-400">Not verified yet</span>;
  const location = i.client_place && (
    <>
      {i.client_place}
      {i.client_latitude && (
        <a className="link ml-2 text-xs font-medium" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${i.client_latitude},${i.client_longitude}`}>View on map</a>
      )}
    </>
  );

  return (
    <div className="space-y-5">
      <button type="button" className="link text-sm" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/ipv"))}>← Back</button>
      <SummaryCard
        title={i.client_name}
        badges={<>{i.account_type && <TypeBadge type={i.account_type} />}<StatusBadge value={i.status} label={IPV_STATUS_LABELS[i.status]} /></>}
        meta={<>IPV ID <span className="font-semibold text-slate-800 dark:text-slate-100">#{i.id}</span></>}
        columns={[
          [["PAN", pan], ["Client email", i.client_email], ["RM", i.rm_email]],
          [["Requested", fmtDateTime12(i.requested_at)], ["Call started", i.started_at ? fmtDateTime12(i.started_at) : null]],
          [["Duration", i.duration_seconds !== null && i.duration_seconds !== undefined ? fmtDuration(i.duration_seconds) : null], ["Client location", location]],
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.6fr)]">
        <DetailSections title="IPV Record" sections={sections} />
        <div>
          <DocumentsPanel viewer={viewer} groups={[{ title: "Captured documents & report", files: others }, { title: "Call recording", files: recordings }]} />
        </div>
        <PreviewPanel viewer={viewer} />
      </div>
    </div>
  );
}
