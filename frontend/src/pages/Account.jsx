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

const STATUS_STEPS = ["placed", "paid", "fulfilled"];
const STATUS_INDEX = { pending: 0, placed: 0, paid: 1, fulfilled: 2 };

function StatusStepper({ status }) {
  const s = (status || "").toLowerCase();
  if (s === "cancelled" || s === "refunded") {
    return <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-steel">{s}</span>;
  }
  const active = STATUS_INDEX[s] ?? 0;
  return (
    <div className="flex items-center gap-2" data-testid="order-stepper">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 ${i <= active ? "bg-ink" : "bg-line"}`} />
            <span className={`font-mono text-[9px] uppercase tracking-[0.18em] ${i <= active ? "text-ink" : "text-steel"}`}>{step}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && <span className={`h-px w-5 ${i < active ? "bg-ink" : "bg-line"}`} />}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = (status || "").toLowerCase();
  const dark = s === "paid" || s === "fulfilled";
  return (
    <span className={`px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] ${dark ? "bg-ink text-paper" : "border border-ink text-ink"}`}>
      {s || "pending"}
    </span>
  );
}

function OrderRow({ order }) {
  const [open, setOpen] = useState(false);
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
  const items = order.items || [];
  return (
    <li className="p-4" data-testid={`order-${String(order.id).slice(0, 8)}`}>
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-widest">#{String(order.id).slice(0, 8)}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-steel">{date} · {items.length} item{items.length === 1 ? "" : "s"}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-bold">${((order.totalCents ?? 0) / 100).toFixed(2)}</div>
          <div className="font-mono text-[9px] uppercase tracking-widest text-steel">{open ? "Hide" : "Details"}</div>
        </div>
      </button>
      <div className="mt-3"><StatusStepper status={order.status} /></div>
      {open && (
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {it.image && <img src={it.image} alt="" loading="lazy" className="product-media h-10 w-10 object-cover" />}
              <div className="flex-1 min-w-0">
                <div className="truncate text-xs font-medium uppercase tracking-wide">{it.name}</div>
                <div className="font-mono text-[10px] text-steel">Qty {it.quantity} · ${((it.unitPriceCents ?? 0) / 100).toFixed(2)}</div>
              </div>
              <div className="font-mono text-xs">${(((it.unitPriceCents ?? 0) * (it.quantity ?? 1)) / 100).toFixed(2)}</div>
            </div>
          ))}
          {order.discountCents > 0 && (
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest text-steel">
              <span>Discount</span><span>−${((order.discountCents) / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [referral, setReferral] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data || [])).catch(() => setOrders([]));
    api.get("/referral/me").then((r) => setReferral(r.data)).catch(() => {});
  }, []);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");

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

      <div className="mb-12 grid gap-4 sm:grid-cols-2" data-testid="account-profile">
        <div className="border border-line p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Profile</div>
          <div className="mt-2 font-display text-lg font-bold">{fullName || "—"}</div>
          <div className="text-sm text-steel">{user?.email}</div>
          {user?.role === "admin" && <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em]">Admin</div>}
        </div>
        {referral?.code && (
          <div className="border border-line p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Give $10, Get $10</div>
            <div className="mt-2 font-display text-lg font-bold tracking-wide">{referral.code}</div>
            <div className="truncate text-xs text-steel">{referral.shareUrl}</div>
          </div>
        )}
      </div>

      <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">ORDERS</h2>
      {orders.length === 0 ? (
        <p className="border border-line bg-mist p-6 text-sm text-steel" data-testid="orders-empty">No orders yet.</p>
      ) : (
        <ul className="divide-y divide-line border border-line" data-testid="orders-list">
          {orders.map((o) => <OrderRow key={o.id} order={o} />)}
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
