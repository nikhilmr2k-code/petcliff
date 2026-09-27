import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";

const EMPTY = {
  name: "", slug: "", category: "walking", petType: "dog", subtype: "",
  color: "Black", priceCents: "", compareAtCents: "", inventoryCount: "50",
  imageUrl: "", description: "",
};

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () => {
    api.get("/products").then((r) => setProducts(r.data || [])).catch(() => setProducts([]));
    api.get("/admin/orders").then((r) => setOrders(r.data || [])).catch(() => setOrders([]));
  };

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
      // Backend POST /api/admin/products accepts the Product entity shape.
      const payload = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        petType: form.petType,
        priceCents: parseInt(form.priceCents, 10) || 0,
        compareAtCents: form.compareAtCents ? parseInt(form.compareAtCents, 10) : null,
        inventoryCount: parseInt(form.inventoryCount, 10) || 0,
        imageUrl: form.imageUrl || null,
        description: form.description || null,
        metadata: { subtype: form.subtype, color: form.color, rating: 5 },
      };
      await api.post("/admin/products", payload);
      toast.success("Product created.");
      setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const fields = [
    ["name", "Name", "text"], ["slug", "Slug", "text"],
    ["priceCents", "Price (cents)", "number"], ["compareAtCents", "Compare-at (cents)", "number"],
    ["inventoryCount", "Stock", "number"], ["subtype", "Subtype", "text"],
    ["color", "Color", "text"], ["imageUrl", "Image URL", "text"],
  ];

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8" data-testid="admin-page">
      <h1 className="mb-8 border-b border-ink pb-4 font-display text-3xl font-black tracking-tight">ADMIN STUDIO</h1>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">NEW PRODUCT</h2>
        <form onSubmit={createProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map(([k, label, type]) => (
            <label key={k} className="block">
              <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">{label}</span>
              <input type={type} value={form[k]} onChange={set(k)} required={k === "name" || k === "slug" || k === "priceCents"}
                className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink" />
            </label>
          ))}
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Pet</span>
            <select value={form.petType} onChange={set("petType")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink">
              <option value="dog">dog</option>
              <option value="cat">cat</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Category</span>
            <select value={form.category} onChange={set("category")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink">
              {["walking", "resting", "grooming", "toys", "accessories"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Description</span>
            <input value={form.description} onChange={set("description")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink" />
          </label>
          <button type="submit" data-testid="admin-create-product" className="self-end bg-ink py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-paper hover:bg-neutral-800">
            Create
          </button>
        </form>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">CATALOG ({products.length})</h2>
        <ul className="divide-y divide-line border border-line">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {p.image && <img src={p.image} alt="" loading="lazy" className="product-media h-10 w-10 object-cover" />}
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel">{p.group} · {p.pet}{p.subtype ? ` · ${p.subtype}` : ""}</div>
                </div>
              </div>
              <div className="font-display font-bold">${(p.price ?? 0).toFixed(2)}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">ORDERS ({orders.length})</h2>
        {orders.length === 0 ? (
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-line border border-line">
            {orders.map((o) => (
              <li key={o.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-mono text-xs">{String(o.id).slice(0, 8)}…</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel">{o.status}</div>
                </div>
                <div className="font-display font-bold">${(((o.totalCents) || 0) / 100).toFixed(2)}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
