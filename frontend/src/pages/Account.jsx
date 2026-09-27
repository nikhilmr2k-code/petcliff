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
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form);
      toast.success(mode === "login" ? "Welcome back." : "Account created.");
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md">
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
