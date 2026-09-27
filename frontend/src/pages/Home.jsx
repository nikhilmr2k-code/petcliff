import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import Marquee from "../components/Marquee";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import ReelModule from "../components/ReelModule";
import Reveal from "../components/Reveal";
import api from "../lib/api";

const DOG_IMG = "https://images.pexels.com/photos/18124747/pexels-photo-18124747.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const CAT_IMG = "https://images.unsplash.com/photo-1715257492511-3582a355928f?crop=entropy&cs=srgb&fm=jpg&q=85&w=940";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    api.get("/products").then((r) => setFeatured(r.data.filter((p) => p.featured).slice(0, 8))).catch(() => {});
  }, []);

  return (
    <main>
      <HeroCarousel />
      <Marquee />

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:py-24" data-testid="shop-by-pet-section">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-steel">01 — Choose Your Side</div>
              <h2 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">Shop by pet.</h2>
            </div>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {[{ label: "Dog", img: DOG_IMG, to: "/shop?pet=dog" }, { label: "Cat", img: CAT_IMG, to: "/shop?pet=cat" }].map((tile, i) => (
            <Reveal key={tile.label} delay={i * 0.1}>
              <Link to={tile.to} data-testid={`pet-tile-${tile.label.toLowerCase()}`}
                className="group relative block aspect-[16/10] overflow-hidden border border-ink">
                <img src={tile.img} alt={tile.label}
                  className="product-media h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-0 left-0 flex w-full items-end justify-between p-7">
                  <span className="font-display text-4xl font-black uppercase text-paper sm:text-5xl">{tile.label}</span>
                  <span className="bg-paper px-5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-200 group-hover:scale-105">
                    Shop {tile.label} →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-mist py-16 lg:py-24" data-testid="featured-section">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-steel">02 — The Edit</div>
                <h2 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">Featured objects.</h2>
              </div>
              <Link to="/shop" data-testid="featured-view-all-link"
                className="group font-mono text-xs uppercase tracking-[0.2em] text-steel transition-colors hover:text-ink">
                View all <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} onOpen={setActive} />)}
          </div>
        </div>
      </section>

      <section className="bg-ink py-20 text-paper lg:py-28" data-testid="kit-cta-band">
        <div className="mx-auto max-w-[1440px] px-4 text-center sm:px-8">
          <Reveal>
            <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-400">03 — The Configurator</div>
            <h2 className="mx-auto max-w-3xl font-display text-4xl font-black uppercase leading-[1.02] tracking-tight sm:text-6xl">
              Style your kit.<br />Save 20%.
            </h2>
            <p className="mx-auto mt-5 max-w-md font-mono text-xs uppercase leading-relaxed tracking-[0.2em] text-neutral-400">
              Pick one object per discipline. Three or more unlocks the kit price.
            </p>
            <Link to="/kit" data-testid="kit-cta-button"
              className="mt-9 inline-block bg-paper px-10 py-4 font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink transition-transform duration-200 hover:scale-105">
              Start Building
            </Link>
          </Reveal>
        </div>
      </section>

      <ReelModule />

      <ProductModal product={active} onClose={() => setActive(null)} />
    </main>
  );
}
