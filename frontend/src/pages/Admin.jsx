import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", slug: "", category: "", petType: "dog", priceCents: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () =>
    api.get("/products").then((r) => setProducts(r.data || [])).catch(() => setProducts([]));

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center" data-testid="admin-locked">
        <h1 className="font-display text-2xl font-black">ADMIN</h1>
        <p className="mt-3 text-sm text-steel">You must sign in to access the admin studio.</p>
        <Link to="/account" className="mt-6 inline-block border border-ink px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] hover:bg-ink hover:text-paper">Sign In</Link>
      </main>
    );
  }
  if (user.role !== "admin") {
    return (
      <main className="mx-auto max-w-xl px-6 py-24 text-center" data-testid="admin-forbidden">
        <h1 className="font-display text-2xl font-black">RESTRICTED</h1>
        <p className="mt-3 text-sm text-steel">This account does not have admin access.</p>
      </main>
    );
  }

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/products", {
        ...form,
        priceCents: parseInt(form.priceCents, 10) || 0,
      });
      toast.success("Product created.");
      setForm({ name: "", slug: "", category: "", petType: "dog", priceCents: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8" data-testid="admin-page">
      <h1 className="mb-8 border-b border-ink pb-4 font-display text-3xl font-black tracking-tight">ADMIN STUDIO</h1>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">NEW PRODUCT</h2>
        <form onSubmit={createProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["name", "Name"], ["slug", "Slug"], ["category", "Category"], ["priceCents", "Price (cents)"],
          ].map(([k, label]) => (
            <label key={k} className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">{label}</span>
              <input value={form[k]} onChange={set(k)} required
                className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink" />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Pet Type</span>
            <select value={form.petType} onChange={set("petType")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink">
              <option value="dog">dog</option>
              <option value="cat">cat</option>
            </select>
          </label>
          <button type="submit" className="self-end bg-ink py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-paper hover:bg-neutral-800">
            Create
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">CATALOG ({products.length})</h2>
        <ul className="divide-y divide-line border border-line">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-4">
              <div>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-steel">{p.category} · {p.petType}</div>
              </div>
              <div className="font-display font-bold">${(((p.priceCents ?? p.price_cents) || 0) / 100).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
