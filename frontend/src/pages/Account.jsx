import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">{label}</span>
      <input
        {...props}
        className="w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
      />
    </label>
  );
}

function AuthForms() {
  const { login, register, loading } = useAuth();
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "forgot") {
        setBusy(true);
        const { data } = await api.post("/auth/forgot-password", { email: form.email });
        toast.success(data?.message || "If an account exists, a reset link has been sent.");
        setMode("login");
        return;
      }
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      toast.success(mode === "login" ? "Welcome back." : "Account created.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      {mode !== "forgot" && (
        <div className="mb-8 flex border border-ink">
          {["login", "register"].map((m) => (
            <button
              key={m}
              data-testid={`account-tab-${m}`}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                mode === m ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-mist"
              }`}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
      )}

      {mode === "forgot" ? (
        <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
          <h2 className="font-display text-xl font-extrabold tracking-tight">RESET PASSWORD</h2>
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-widest text-steel">
            Enter your email and we'll send a reset link.
          </p>
          <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
          <button
            type="submit"
            disabled={busy}
            data-testid="forgot-submit"
            className="w-full bg-ink py-4 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send Reset Link"}
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full font-mono text-[11px] uppercase tracking-[0.2em] text-steel hover:text-ink"
          >
            ← Back to sign in
          </button>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-4" data-testid="account-form">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" value={form.firstName} onChange={set("firstName")} />
              <Field label="Last Name" value={form.lastName} onChange={set("lastName")} />
            </div>
          )}
          <Field label="Email" type="email" required value={form.email} onChange={set("email")} />
          <Field label="Password" type="password" required minLength={8} value={form.password} onChange={set("password")} />
          <button
            type="submit"
            disabled={loading}
            data-testid="account-submit"
            className="w-full bg-ink py-4 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
          {mode === "login" && (
            <button
              type="button"
              onClick={() => setMode("forgot")}
              data-testid="forgot-link"
              className="w-full font-mono text-[11px] uppercase tracking-[0.2em] text-steel hover:text-ink"
            >
              Forgot password?
            </button>
          )}
        </form>
      )}
    </div>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/change-password", form);
      toast.success("Password updated.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-12">
      <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">CHANGE PASSWORD</h2>
      <form onSubmit={submit} className="max-w-md space-y-4" data-testid="change-password-form">
        <Field label="Current Password" type="password" required value={form.currentPassword} onChange={set("currentPassword")} />
        <Field label="New Password" type="password" required minLength={8} value={form.newPassword} onChange={set("newPassword")} />
        <button
          type="submit"
          disabled={busy}
          data-testid="change-password-submit"
          className="border border-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
        >
          {busy ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data || [])).catch(() => setOrders([]));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 flex items-end justify-between border-b border-ink pb-6">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight">MY ACCOUNT</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-steel">{user?.email}</p>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          data-testid="account-logout"
          className="border border-ink px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-ink hover:text-paper"
        >
          Sign Out
        </button>
      </div>

      <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">ORDER HISTORY</h2>
      {orders.length === 0 ? (
        <p className="border border-line bg-mist p-6 text-sm text-steel">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-line border border-line">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest">#{String(o.id).slice(0, 8)}</div>
                <div className="text-xs text-steel">{o.status}</div>
              </div>
              <div className="font-display font-bold">${((o.totalCents ?? 0) / 100).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      )}

      <ChangePassword />
    </div>
  );
}

export default function Account() {
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8" data-testid="account-page">
      {user ? <Dashboard /> : <AuthForms />}
    </main>
  );
}
