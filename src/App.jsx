import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Payments from "./pages/Payments";
import Ipv from "./pages/Ipv";
import IpvDetail from "./pages/IpvDetail";
import Boid from "./pages/Boid";
import Users from "./pages/Users";
import AuditLogs from "./pages/AuditLogs";

const HOME = [["dashboard", "/"], ["clients", "/clients"], ["payments", "/payments"], ["ipv", "/ipv"], ["boid", "/boid"], ["users", "/users"], ["audit", "/audit-logs"]];

// A page the user's role / access doesn't include goes to the first one it does.
function Allowed({ module, children }) {
  const { can } = useAuth();
  if (can(module)) return children;
  const first = HOME.find(([m]) => can(m));
  return first ? <Navigate to={first[1]} replace /> : <p className="p-8 text-sm text-slate-500">Your login has no pages assigned. Ask a Super Admin.</p>;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Allowed module="dashboard"><Dashboard /></Allowed>} />
        <Route path="clients" element={<Allowed module="clients"><Clients /></Allowed>} />
        <Route path="clients/:pan" element={<Allowed module="clients"><ClientDetail /></Allowed>} />
        <Route path="payments" element={<Allowed module="payments"><Payments /></Allowed>} />
        <Route path="ipv" element={<Allowed module="ipv"><Ipv /></Allowed>} />
        <Route path="ipv/:id" element={<Allowed module="ipv"><IpvDetail /></Allowed>} />
        <Route path="boid" element={<Allowed module="boid"><Boid /></Allowed>} />
        <Route path="users" element={<Allowed module="users"><Users /></Allowed>} />
        <Route path="audit-logs" element={<Allowed module="audit"><AuditLogs /></Allowed>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
