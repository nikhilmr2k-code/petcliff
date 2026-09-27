import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";

const EMPTY = {
  name: "", slug: "", category: "walking", petType: "dog", subtype: "",
  color: "Black", priceCents: "", compareAtCents: "", inventoryCount: "50",
  imageUrl: "", description: "", rating: 5,
};

// Map a ProductResponse (dollars, pet, group, image) back to the entity form shape.
function toForm(p) {
  return {
    name: p.name || "",
    slug: p.slug || "",
    category: p.group || "walking",
    petType: p.pet || "dog",
    subtype: p.subtype || "",
    color: p.color || "",
    priceCents: p.price != null ? String(Math.round(p.price * 100)) : "",
    compareAtCents: p.compareAt != null ? String(Math.round(p.compareAt * 100)) : "",
    inventoryCount: p.stock != null ? String(p.stock) : "50",
    imageUrl: p.image || "",
    description: p.description || "",
    rating: p.rating ?? 5,
  };
}

function toPayload(form) {
  return {
    name: form.name,
    slug: form.slug,
    category: form.category,
    petType: form.petType,
    priceCents: parseInt(form.priceCents, 10) || 0,
    compareAtCents: form.compareAtCents ? parseInt(form.compareAtCents, 10) : null,
    inventoryCount: parseInt(form.inventoryCount, 10) || 0,
    imageUrl: form.imageUrl || null,
    description: form.description || null,
    metadata: { subtype: form.subtype, color: form.color, rating: Number(form.rating) || 5 },
  };
}

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promos, setPromos] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: "", kind: "percent", value: "" });
  const fileRef = useRef(null);
  const formRef = useRef(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const load = () => {
    api.get("/products").then((r) => setProducts(r.data || [])).catch(() => setProducts([]));
    api.get("/admin/orders").then((r) => setOrders(r.data || [])).catch(() => setOrders([]));
    api.get("/admin/promos").then((r) => setPromos(r.data || [])).catch(() => setPromos([]));
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

  const resetForm = () => { setForm(EMPTY); setEditingId(null); };

  const submitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, toPayload(form));
        toast.success("Product updated.");
      } else {
        await api.post("/admin/products", toPayload(form));
        toast.success("Product created.");
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const editProduct = (p) => {
    setEditingId(p.id);
    setForm(toForm(p));
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Product deleted.");
      if (editingId === p.id) resetForm();
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Clear the JSON default so the browser sets multipart/form-data WITH the boundary.
      const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": undefined } });
      setForm((f) => ({ ...f, imageUrl: data.url }));
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const createPromo = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/promos", { code: promoForm.code, kind: promoForm.kind, value: parseInt(promoForm.value, 10) || 0, active: true });
      toast.success("Promo created.");
      setPromoForm({ code: "", kind: "percent", value: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err));
    }
  };

  const togglePromo = async (code) => {
    try {
      await api.patch(`/admin/promos/${code}/toggle`);
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

      <section ref={formRef} className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">
          {editingId ? "EDIT PRODUCT" : "NEW PRODUCT"}
        </h2>
        <form onSubmit={submitProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          {/* Image upload widget */}
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Upload Image</span>
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadImage} data-testid="admin-image-upload"
                className="block w-full text-xs file:mr-3 file:border file:border-ink file:bg-paper file:px-3 file:py-2 file:font-mono file:text-[10px] file:uppercase file:tracking-[0.2em] hover:file:bg-ink hover:file:text-paper" />
              {uploading && <span className="font-mono text-[10px] uppercase tracking-widest text-steel">Uploading…</span>}
              {form.imageUrl && <img src={form.imageUrl} alt="preview" className="product-media h-12 w-12 shrink-0 object-cover border border-line" />}
            </div>
          </label>

          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Description</span>
            <input value={form.description} onChange={set("description")}
              className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink" />
          </label>
          <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
            <button type="submit" data-testid="admin-create-product" className="bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-paper hover:bg-neutral-800">
              {editingId ? "Save Changes" : "Create"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="border border-ink px-6 py-2.5 font-mono text-xs uppercase tracking-[0.2em] hover:bg-mist">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">CATALOG ({products.length})</h2>
        <ul className="divide-y divide-line border border-line">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-4" data-testid={`admin-product-${p.id}`}>
              <div className="flex items-center gap-3">
                {p.image && <img src={p.image} alt="" loading="lazy" className="product-media h-10 w-10 object-cover" />}
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-steel">{p.group} · {p.pet}{p.subtype ? ` · ${p.subtype}` : ""}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-display font-bold">${(p.price ?? 0).toFixed(2)}</div>
                <button onClick={() => editProduct(p)} data-testid={`admin-edit-${p.id}`}
                  className="border border-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] hover:bg-ink hover:text-paper">Edit</button>
                <button onClick={() => deleteProduct(p)} data-testid={`admin-delete-${p.id}`}
                  className="border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-steel hover:border-ink hover:text-ink">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-lg font-extrabold tracking-[0.12em]">PROMOTIONS ({promos.length})</h2>
        <form onSubmit={createPromo} className="mb-4 flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Code</span>
            <input value={promoForm.code} onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value }))} required
              className="border border-line bg-paper px-3 py-2.5 text-sm uppercase outline-none focus:border-ink" />
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Kind</span>
            <select value={promoForm.kind} onChange={(e) => setPromoForm((f) => ({ ...f, kind: e.target.value }))}
              className="border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink">
              <option value="percent">percent</option>
              <option value="fixed">fixed (cents)</option>
              <option value="referral">referral</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.25em] text-steel">Value</span>
            <input type="number" value={promoForm.value} onChange={(e) => setPromoForm((f) => ({ ...f, value: e.target.value }))} required
              className="w-28 border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink" />
          </label>
          <button type="submit" className="bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-paper hover:bg-neutral-800">Add</button>
        </form>
        {promos.length > 0 && (
          <ul className="divide-y divide-line border border-line">
            {promos.map((pr) => (
              <li key={pr.code} className="flex items-center justify-between p-3">
                <div className="font-mono text-xs uppercase tracking-widest">{pr.code} · {pr.kind} · {pr.value}</div>
                <button onClick={() => togglePromo(pr.code)}
                  className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] ${pr.active ? "bg-ink text-paper" : "border border-line text-steel"}`}>
                  {pr.active ? "Active" : "Inactive"}
                </button>
              </li>
            ))}
          </ul>
        )}
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
