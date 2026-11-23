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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="brand-strip fixed inset-x-0 top-0 z-10" />
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-pink/15 blur-3xl" />
      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-lift dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_1.05fr]">
        {/* brand panel */}
        <div className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-brand-navy p-10 text-white md:flex">
          <div aria-hidden="true" className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-brand-blue opacity-60 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-brand-pink opacity-50 blur-3xl" />
          <span className="relative inline-flex self-start rounded-2xl bg-white px-4 py-2.5 shadow-lg">
            <img src={logo} alt="Aionion Capital" className="h-11" />
          </span>
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">NRE - NRO</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight">
              Every NRI application, <span className="text-brand-pink">at a glance.</span>
            </h2>
            <p className="mt-4 text-sm text-white/70">Clients, payments, video IPV and BOIDs — in one place.</p>
          </div>
          <p className="relative text-xs tracking-[0.25em] text-white/50">RESEARCH | TRUST | FOREVER</p>
        </div>

        <div className="p-8 sm:p-10">
          <img src={logo} alt="Aionion Capital" className="mx-auto h-14 dark:rounded-lg dark:bg-white dark:p-1 md:hidden" />
          <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-pink md:mt-0 md:text-left">Admin</p>
          <h1 className="mt-1 text-center text-2xl font-bold text-slate-900 dark:text-white md:text-left md:text-3xl">NRI Dashboard</h1>
          <p className="mt-2 text-center text-sm text-slate-500 md:text-left">Sign in with your dashboard username and password.</p>
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
    </div>
  );
}
