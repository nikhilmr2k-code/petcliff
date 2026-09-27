import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import api, { formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: pw });
      toast.success(data?.message || "Password reset. Please sign in.");
      navigate("/account");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8" data-testid="reset-password-page">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 font-display text-2xl font-black tracking-tight">SET A NEW PASSWORD</h1>
        {!token ? (
          <p className="border border-line bg-mist p-6 text-sm text-steel">
            This reset link is missing its token. Request a new one from the sign-in page.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4" data-testid="reset-form">
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">New Password</span>
              <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)}
                className="w-full border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-ink" />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Confirm Password</span>
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full border border-line bg-paper px-4 py-3 text-sm outline-none focus:border-ink" />
            </label>
            <button type="submit" disabled={busy} data-testid="reset-submit"
              className="w-full bg-ink py-4 font-mono text-xs uppercase tracking-[0.25em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-50">
              {busy ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
