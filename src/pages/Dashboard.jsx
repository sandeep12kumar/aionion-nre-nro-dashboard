import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ErrorBox, Loading, StatCard, useLoader } from "../components/ui";

const H2 = ({ children }) => <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900 dark:text-white">{children}</h2>;
const H3 = ({ children }) => <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</p>;

const STATUS = [
  ["in_progress", "In Progress", "default"],
  ["completed", "Completed", "green"],
  ["abandoned", "Abandoned", "red"],
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { data, error, loading, reload } = useLoader(() => api.get("/summary"), []);
  const go = (path) => can("clients") && navigate(path);
  const goIpv = (path) => can("ipv") && navigate(path);

  if (loading && !data) return <Loading />;
  if (error && !data) return <ErrorBox error={error} onRetry={reload} />;
  const { applications: all, types, ipv, boid } = data;

  const typeSection = (type) => {
    const t = types[type];
    return (
      <section key={type}>
        <H2>{type} Accounts</H2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label={`Total ${type}`} value={t.total} onClick={() => go(`/clients?type=${type}`)} />
          <StatCard label="Today" value={t.today} />
          <StatCard label="Last 7 days" value={t.last7} />
        </div>
        <H3>Application status</H3>
        <div className="grid gap-4 sm:grid-cols-3">
          {STATUS.filter(([key]) => t.byStatus[key] || key !== "abandoned").map(([key, label, tone]) => (
            <StatCard key={key} label={label} value={t.byStatus[key] || 0} tone={tone} onClick={() => go(`/clients?type=${type}&status=${key}`)} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className={loading ? "opacity-60 transition" : ""}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Applications" value={all.total} onClick={() => go("/clients")} />
        <StatCard label="NRE Accounts" value={types.NRE.total} onClick={() => go("/clients?type=NRE")} />
        <StatCard label="NRO Accounts" value={types.NRO.total} onClick={() => go("/clients?type=NRO")} />
        <StatCard label="IPV Sessions" value={ipv.total} onClick={() => goIpv("/ipv")} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {STATUS.map(([key, label, tone]) => (
          <StatCard key={key} label={label} value={all.byStatus[key] || 0} tone={tone} onClick={() => go(`/clients?status=${key}`)} />
        ))}
      </div>

      {typeSection("NRE")}
      {typeSection("NRO")}

      <H2>IPV (Video Verification)</H2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total IPV" value={ipv.total} onClick={() => goIpv("/ipv")} />
        <StatCard label="Today" value={ipv.today} />
        <StatCard label="Last 7 days" value={ipv.last7} />
      </div>
      <H3>Session status</H3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["requested", "Requested", "amber"], ["live", "Live", "violet"], ["completed", "Completed", "green"], ["cancelled", "Cancelled", "default"]].map(([key, label, tone]) => (
          <StatCard key={key} label={label} value={ipv.byStatus[key] || 0} tone={ipv.byStatus[key] ? tone : "default"} onClick={() => goIpv(`/ipv?status=${key}`)} />
        ))}
      </div>

      <H2>BOID</H2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Accounts" value={boid.total} onClick={can("boid") ? () => navigate("/boid") : undefined} />
        <StatCard label="Used" value={boid.used} tone="red" />
        <StatCard label="Available" value={boid.available} tone={boid.low ? "red" : "green"} />
      </div>
      <p className={`mt-2 text-sm ${boid.low ? "font-medium text-red-500" : "text-slate-500"}`}>
        {boid.low ? `Low stock: alert below ${boid.alertBelow}. Upload more BOIDs.` : `Alert below ${boid.alertBelow}`}
      </p>
    </div>
  );
}
