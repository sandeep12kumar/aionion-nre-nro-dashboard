import { useState } from "react";
import { api } from "../lib/api";
import { MODULE_LABELS, ROLE_LABELS, useAuth } from "../lib/auth";
import { fmtDate, fmtDateTime } from "../lib/format";
import { Badge, ErrorBox, Field, Loading, Modal, PasswordInput, useLoader } from "../components/ui";

const EMPTY = { username: "", password: "", fullName: "", email: "", role: "admin" };

function AddUser({ onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/users", form);
      setForm(EMPTY);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(5,minmax(0,1fr))_auto] lg:items-end">
        <Field label="Username"><input className="input" value={form.username} onChange={set("username")} autoComplete="off" /></Field>
        <Field label="Password"><PasswordInput value={form.password} onChange={set("password")} /></Field>
        <Field label="Full Name"><input className="input" value={form.fullName} onChange={set("fullName")} /></Field>
        <Field label="Email"><input className="input" type="email" value={form.email} onChange={set("email")} /></Field>
        <Field label="Role">
          <select className="input" value={form.role} onChange={set("role")}>
            {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <button type="submit" className="btn-primary" disabled={busy || !form.username || !form.password}>{busy ? "Adding…" : "Add User"}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Password: at least 8 characters. Super Admin: everything incl. users and audit logs · Admin: other pages, can upload BOIDs · Viewer: other pages, read only.
      </p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </form>
  );
}

function EditUser({ user, meta, onClose, onSaved, isSelf }) {
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role);
  const [custom, setCustom] = useState(Boolean(user.customModules));
  const [modules, setModules] = useState(user.customModules || meta.roleModules[user.role]);
  const [isActive, setIsActive] = useState(user.isActive);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const roleModules = meta.roleModules[role] || [];

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/users/${user.id}`, { fullName, email, role, isActive, modules: custom ? modules.filter((m) => roleModules.includes(m)) : null });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${user.username}`} width="max-w-lg">
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Role">
            <select className="input" value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value)}>
              {Object.entries(ROLE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Login">
            <select className="input" value={isActive ? "1" : "0"} disabled={isSelf} onChange={(e) => setIsActive(e.target.value === "1")}>
              <option value="1">Active</option><option value="0">Deactivated</option>
            </select>
          </Field>
        </div>
        <div>
          <p className="label">Access</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" className="accent-violet-600" checked={!custom} onChange={() => setCustom(false)} /> All pages of the role
          </label>
          <label className="mt-1 flex items-center gap-2 text-sm">
            <input type="radio" className="accent-violet-600" checked={custom} onChange={() => setCustom(true)} /> Only these pages:
          </label>
          {custom && (
            <div className="mt-2 grid grid-cols-2 gap-1 pl-6">
              {roleModules.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-violet-600" checked={modules.includes(m)}
                    onChange={() => setModules((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]))} />
                  {MODULE_LABELS[m]}
                </label>
              ))}
            </div>
          )}
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

function ResetPassword({ user, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/users/${user.id}/reset-password`, { password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={`Reset password · ${user.username}`}>
      {done ? (
        <div className="space-y-4">
          <p className="text-sm text-emerald-600">Password reset. Their other sessions were signed out; share the new password with them securely.</p>
          <button type="button" className="btn-primary w-full" onClick={onClose}>Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password (at least 8 characters)"><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || password.length < 8}>{busy ? "Saving…" : "Reset password"}</button>
        </form>
      )}
    </Modal>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const { data, error, loading, reload } = useLoader(() => api.get("/users"), []);
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);

  return (
    <div className="space-y-5">
      <AddUser onAdded={reload} />
      <ErrorBox error={error} onRetry={reload} />
      {loading && !data ? <Loading /> : data && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40">
                <tr>{["Username", "Full Name", "Email", "Role", "Access", "Last login", "Created", ""].map((h) => <th key={h} className="th">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="td font-medium">
                      {u.username}
                      {!u.isActive && <span className="ml-2"><Badge tone="red">Deactivated</Badge></span>}
                      {u.lockedUntil && <span className="ml-2" title="Reset the password to unlock"><Badge tone="amber">Locked</Badge></span>}
                    </td>
                    <td className="td">{u.fullName || <span className="muted">N/A</span>}</td>
                    <td className="td">{u.email || <span className="muted">N/A</span>}</td>
                    <td className="td">{ROLE_LABELS[u.role]}</td>
                    <td className="td">{u.customModules ? u.modules.map((m) => MODULE_LABELS[m]).join(", ") || "None" : "All pages (by role)"}</td>
                    <td className="td">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : <span className="muted">Never</span>}</td>
                    <td className="td">{fmtDate(u.createdAt)}</td>
                    <td className="td">
                      <button type="button" className="link mr-4" onClick={() => setEditing(u)}>Edit</button>
                      <button type="button" className="link" onClick={() => setResetting(u)}>Reset password</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editing && (
        <EditUser user={editing} meta={data} isSelf={editing.id === me?.id} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />
      )}
      {resetting && <ResetPassword user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}
