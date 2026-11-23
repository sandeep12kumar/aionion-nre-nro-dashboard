import { useState } from "react";
import logo from "../assets/aionion-logo.png";
import { useAuth } from "../lib/auth";
import { Field, PasswordInput } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-rose-400/10 blur-3xl" />
      <div className="card relative w-full max-w-md p-8">
        <img src={logo} alt="Aionion Capital" className="mx-auto h-16 dark:rounded-lg dark:bg-white dark:p-1" />
        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-widest text-rose-500">NRE - NRO</p>
        <h1 className="mt-1 text-center text-2xl font-bold text-slate-900 dark:text-white">NRI Dashboard</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Username">
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
          </Field>
          <Field label="Password">
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy || !username || !password}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
