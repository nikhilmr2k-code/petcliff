import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import Reveal from "../components/Reveal";
import api from "../lib/api";
import { useCart, KIT_MIN, KIT_DISCOUNT } from "../context/CartContext";

const STEPS = [
  { key: "walking", label: "Walking Gear", hint: "Harness, leash, or collar" },
  { key: "toys", label: "Toys", hint: "Enrichment & play" },
  { key: "resting", label: "Resting", hint: "Beds & loungers" },
  { key: "grooming", label: "Grooming", hint: "Brushes, combs, dental" },
  { key: "accessories", label: "Accessories", hint: "Goggles, AirTag, bottles" },
];

export default function KitBuilder() {
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({}); // stepKey -> product
  const { addKit } = useCart();

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const chosen = useMemo(() => STEPS.map((s) => selected[s.key]).filter(Boolean), [selected]);
  const individual = useMemo(() => chosen.reduce((s, p) => s + p.price, 0), [chosen]);
  const unlocked = chosen.length >= KIT_MIN;
  const kitPrice = Math.round(individual * (1 - (unlocked ? KIT_DISCOUNT : 0)) * 100) / 100;
  const savings = Math.round((individual - kitPrice) * 100) / 100;

  const toggle = (stepKey, product) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[stepKey]?.id === product.id) delete next[stepKey];
      else next[stepKey] = product;
      return next;
    });
  };

  const handleAdd = () => {
    if (!chosen.length) return;
    addKit(chosen);
    if (unlocked) toast.success(`Kit added — you saved $${savings.toFixed(2)}`);
    else toast.success(`Kit added — add ${KIT_MIN - chosen.length} more item(s) like this to unlock −20%`);
    setSelected({});
  };

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-8 lg:py-16" data-testid="kit-builder-page">
      <Reveal>
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-steel">The Configurator</div>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight sm:text-6xl">Style Your Kit.</h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-neutral-600">
          Select one object per discipline. <span className="font-bold text-ink">Three or more items unlock the kit price — 20% off the individual total.</span> One or two items check out at standard retail, no bundle discount.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="space-y-14 lg:col-span-8">
          {STEPS.map((step, idx) => {
            const items = products.filter((p) => p.group === step.key);
            return (
              <Reveal key={step.key} delay={idx * 0.04}>
                <section data-testid={`kit-step-${step.key}`}>
                  <div className="mb-5 flex items-baseline justify-between border-b border-ink pb-3">
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-steel">0{idx + 1}</span>
                      <h2 className="font-display text-xl font-black uppercase tracking-tight">{step.label}</h2>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-steel">{step.hint}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {items.map((p) => {
                      const isSel = selected[step.key]?.id === p.id;
                      return (
                        <button key={p.id} data-testid={`kit-option-${p.id}`} onClick={() => toggle(step.key, p)}
                          className={`group relative border text-left transition-all duration-200 ${isSel ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"}`}>
                          <div className="relative aspect-square overflow-hidden">
                            <img src={p.image} alt={p.name} className="mono-media h-full w-full object-cover" />
                            {isSel && (
                              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center bg-paper text-ink"><Check size={13} /></span>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-xs font-bold uppercase leading-snug tracking-wide">{p.name}</p>
                            <p className={`mt-1 font-mono text-[11px] ${isSel ? "text-neutral-300" : "text-steel"}`}>${p.price.toFixed(2)} · {p.pet}</p>
                          </div>
                        </button>
                      );
                    })}
                    {items.length === 0 && <p className="col-span-full py-6 font-mono text-[10px] uppercase tracking-widest text-steel">No objects in this discipline yet</p>}
                  </div>
                </section>
              </Reveal>
            );
          })}
        </div>

        <aside className="lg:col-span-4">
          <div className="border border-ink lg:sticky lg:top-24" data-testid="kit-summary">
            <div className="border-b border-ink bg-ink px-6 py-4 text-paper">
              <h3 className="font-display text-lg font-black uppercase tracking-wide">Your Kit</h3>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-400" data-testid="kit-count">
                {chosen.length} of {KIT_MIN}+ items selected
              </p>
            </div>
            <div className="px-6 py-5">
              {chosen.length === 0 ? (
                <p className="py-6 text-center font-mono text-[10px] uppercase leading-relaxed tracking-widest text-steel">
                  Pick one object per discipline.<br />Three unlocks the kit price.
                </p>
              ) : (
                <ul className="space-y-3">
                  {chosen.map((p) => (
                    <li key={p.id} className="flex items-center gap-3" data-testid={`kit-selected-${p.id}`}>
                      <img src={p.image} alt="" className="mono-media h-10 w-10 border border-line object-cover" />
                      <span className="flex-1 text-xs font-bold uppercase tracking-wide">{p.name}</span>
                      <span className="font-mono text-xs">${p.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 space-y-1.5 border-t border-line pt-4 font-mono text-xs">
                <div className="flex justify-between text-steel"><span>Individual items</span><span data-testid="kit-individual-total">${individual.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold">
                  <span>Kit price {unlocked ? "(−20%)" : ""}</span>
                  <span data-testid="kit-price">${kitPrice.toFixed(2)}</span>
                </div>
                {unlocked && <div className="flex justify-between font-bold" data-testid="kit-savings"><span>You save</span><span>${savings.toFixed(2)}</span></div>}
              </div>

              {!unlocked && chosen.length > 0 && (
                <p className="mt-4 border border-dashed border-line p-3 font-mono text-[10px] uppercase leading-relaxed tracking-widest text-steel" data-testid="kit-locked-hint">
                  Add {KIT_MIN - chosen.length} more item{KIT_MIN - chosen.length > 1 ? "s" : ""} to unlock 20% off. 1–2 items = standard retail.
                </p>
              )}

              <motion.button data-testid="kit-add-to-cart-button" whileTap={{ scale: 0.97 }} onClick={handleAdd} disabled={!chosen.length}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-ink py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-40">
                Add Kit to Cart <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
