import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import Reveal from "../components/Reveal";
import api from "../lib/api";

const PET_FILTERS = [
  { key: "", label: "All Pets" },
  { key: "dog", label: "Dog" },
  { key: "cat", label: "Cat" },
];
const GROUP_FILTERS = [
  { key: "", label: "Everything" },
  { key: "walking", label: "Walking Gear" },
  { key: "resting", label: "Resting" },
  { key: "grooming", label: "Grooming" },
  { key: "toys", label: "Toys" },
  { key: "accessories", label: "Accessories" },
];
const SUBTYPES = {
  walking: [["harness", "Harnesses"], ["leash", "Leashes"], ["collar", "Collars"]],
  resting: [["bed", "Beds"]],
  grooming: [["brush", "Brushes"], ["comb", "Combs"], ["dental", "Dental"]],
  toys: [["enrichment", "Enrichment"], ["chew", "Chew"], ["puzzle", "Puzzle"], ["wand", "Wands"]],
  accessories: [["goggles", "Goggles"], ["airtag", "AirTag"], ["bottle", "Bottles"]],
};

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const pet = searchParams.get("pet") || "";
  const group = searchParams.get("group") || "";
  const subtype = searchParams.get("subtype") || "";
  const q = searchParams.get("q") || "";

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key === "group") next.delete("subtype");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { pet: pet || undefined, group: group || undefined, subtype: subtype || undefined, q: q || undefined } })
      .then((r) => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pet, group, subtype, q]);

  const subtypes = SUBTYPES[group] || [];

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:py-16" data-testid="shop-page">
      <Reveal>
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-steel">The Collection</div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
          {pet === "dog" ? "Dog." : pet === "cat" ? "Cat." : "Everything."}
        </h1>
        <p className="mt-3 max-w-lg text-sm text-neutral-600">Monochrome gear across five disciplines. Every object vetted for build, safety, and silhouette.</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="lg:col-span-3" data-testid="shop-sidebar">
          <div className="space-y-8 lg:sticky lg:top-24">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
              <input data-testid="shop-search-input" defaultValue={q}
                onKeyDown={(e) => e.key === "Enter" && setParam("q", e.target.value)}
                placeholder="SEARCH"
                className="w-full border border-line bg-paper py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-widest outline-none focus:border-ink" />
            </div>
            <div>
              <div className="mb-3 border-b border-ink pb-2 font-mono text-[10px] uppercase tracking-[0.25em]">Pet</div>
              <ul className="space-y-2">
                {PET_FILTERS.map((f) => (
                  <li key={f.key}>
                    <button data-testid={`filter-pet-${f.key || "all"}`} onClick={() => setParam("pet", f.key)}
                      className={`text-sm transition-colors ${pet === f.key ? "font-bold underline underline-offset-4" : "text-steel hover:text-ink"}`}>
                      {f.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-3 border-b border-ink pb-2 font-mono text-[10px] uppercase tracking-[0.25em]">Discipline</div>
              <ul className="space-y-2">
                {GROUP_FILTERS.map((f) => (
                  <li key={f.key}>
                    <button data-testid={`filter-group-${f.key || "all"}`} onClick={() => setParam("group", f.key)}
                      className={`text-sm transition-colors ${group === f.key ? "font-bold underline underline-offset-4" : "text-steel hover:text-ink"}`}>
                      {f.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {subtypes.length > 0 && (
              <div>
                <div className="mb-3 border-b border-ink pb-2 font-mono text-[10px] uppercase tracking-[0.25em]">Type</div>
                <ul className="space-y-2">
                  <li>
                    <button data-testid="filter-subtype-all" onClick={() => setParam("subtype", "")}
                      className={`text-sm ${!subtype ? "font-bold underline underline-offset-4" : "text-steel hover:text-ink"}`}>All types</button>
                  </li>
                  {subtypes.map(([key, label]) => (
                    <li key={key}>
                      <button data-testid={`filter-subtype-${key}`} onClick={() => setParam("subtype", key)}
                        className={`text-sm ${subtype === key ? "font-bold underline underline-offset-4" : "text-steel hover:text-ink"}`}>{label}</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>

        <div className="lg:col-span-9">
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.25em] text-steel" data-testid="shop-count">
            {loading ? "Loading…" : `${products.length} object${products.length === 1 ? "" : "s"}`}
          </div>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} onOpen={setActive} />)}
          </div>
          {!loading && products.length === 0 && (
            <div className="border border-dashed border-line py-24 text-center" data-testid="shop-empty">
              <p className="font-display text-2xl font-black uppercase">Nothing here.</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-steel">Loosen the filters and try again</p>
            </div>
          )}
        </div>
      </div>

      <ProductModal product={active} onClose={() => setActive(null)} />
    </main>
  );
}
