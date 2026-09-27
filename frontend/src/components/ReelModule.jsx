import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, X, ChevronLeft, ChevronRight } from "lucide-react";
import Reveal from "./Reveal";
import api from "../lib/api";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

const REELS = [
  { video: "https://assets.mixkit.co/videos/1548/1548-720.mp4", caption: "The Daily Pant", match: ["Bungee Reflexive Leash", "AirTag & Reflective Collar"] },
  { video: "https://assets.mixkit.co/videos/1210/1210-720.mp4", caption: "Double Trouble", match: ["Enrichment Puzzle Mat", "Chew Module"] },
  { video: "https://assets.mixkit.co/videos/1552/1552-720.mp4", caption: "Off Duty", match: ["Orthopedic Bolster Bed", "Reflective Front Harness"] },
  { video: "https://assets.mixkit.co/videos/1494/1494-1080.mp4", caption: "Trail Ready", match: ["Tactical Harness Set", "Bungee Reflexive Leash"] },
  { video: "https://assets.mixkit.co/videos/1532/1532-1080.mp4", caption: "Groom Room", match: ["Slicker Brush", "Stainless Steel Comb"] },
];

export default function ReelModule() {
  const [products, setProducts] = useState([]);
  const [active, setActive] = useState(null);
  const { addItem } = useCart();
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data)).catch(() => {});
  }, []);

  const looksFor = (reel) => products.filter((p) => reel.match.includes(p.name));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:py-24" data-testid="reel-section">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-steel">On the Feed</div>
            <h2 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">Shop the look.</h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="hidden max-w-xs font-mono text-[11px] uppercase leading-relaxed tracking-widest text-steel sm:block">Tap a reel to shop the gear in frame</p>
            <div className="flex gap-2">
              <button data-testid="reel-prev" onClick={() => scrollBy(-1)} aria-label="Previous reels"
                className="flex h-10 w-10 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"><ChevronLeft size={16} /></button>
              <button data-testid="reel-next" onClick={() => scrollBy(1)} aria-label="More reels"
                className="flex h-10 w-10 items-center justify-center border border-ink transition-colors hover:bg-ink hover:text-paper"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </Reveal>

      <div ref={trackRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" data-testid="reel-track">
        {REELS.map((reel, i) => (
          <Reveal key={reel.video} delay={i * 0.06} className="w-[80%] shrink-0 snap-start sm:w-[320px]">
            <div className="group relative aspect-[9/13] overflow-hidden border border-ink bg-ink" data-testid={`reel-card-${i}`}>
              <video src={reel.video} autoPlay muted loop playsInline
                className="product-media h-full w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-5 pt-16">
                <p className="font-display text-lg font-extrabold uppercase text-paper">{reel.caption}</p>
                <button data-testid={`reel-shop-look-${i}`} onClick={() => setActive(active === i ? null : i)}
                  className="mt-3 inline-flex items-center gap-2 bg-paper px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-200 hover:scale-105">
                  <ShoppingBag size={12} /> Shop the Look
                </button>
              </div>
              <AnimatePresence>
                {active === i && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                    className="absolute inset-x-3 bottom-3 border border-ink bg-paper p-3 shadow-2xl" data-testid={`reel-popup-${i}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">In this reel</span>
                      <button onClick={() => setActive(null)} aria-label="Close look" className="text-steel hover:text-ink"><X size={14} /></button>
                    </div>
                    <div className="space-y-2">
                      {looksFor(reel).map((p) => (
                        <div key={p.id} className="flex items-center gap-3 border border-line p-2">
                          <img src={p.image} alt="" className="product-media h-10 w-10 object-cover" />
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wide">{p.name}</p>
                            <p className="font-mono text-[10px] text-steel">${p.price.toFixed(2)}</p>
                          </div>
                          <button data-testid={`reel-add-${p.id}`} onClick={() => { addItem(p); toast.success(`${p.name} added to cart`); }}
                            className="bg-ink px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-paper hover:bg-neutral-800">
                            Add
                          </button>
                        </div>
                      ))}
                      {looksFor(reel).length === 0 && <p className="py-2 font-mono text-[10px] uppercase tracking-widest text-steel">Loading looks…</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
