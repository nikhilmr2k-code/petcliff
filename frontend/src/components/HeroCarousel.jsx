import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

const SLIDES = [
  {
    video: "https://assets.mixkit.co/videos/1494/1494-1080.mp4",
    kicker: "Vol. 01 — The Walking Edit",
    lines: ["WHERE PETS THRIVE,", "HOMES COME ALIVE."],
    cta: { label: "Shop the Drop", to: "/shop" },
  },
  {
    video: "https://assets.mixkit.co/videos/1532/1532-1080.mp4",
    kicker: "Monochrome gear for daily rituals",
    lines: ["EVERY WALK,", "A RUNWAY."],
    cta: { label: "Shop Walking Gear", to: "/shop?group=walking" },
  },
  {
    video: "https://assets.mixkit.co/videos/45868/45868-720.mp4",
    kicker: "Style Your Kit — save 20% on 3+ items",
    lines: ["PLAY IS", "A DISCIPLINE."],
    cta: { label: "Build Your Kit", to: "/kit" },
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative h-[82vh] min-h-[540px] w-full overflow-hidden bg-ink text-paper" data-testid="hero-carousel">
      <AnimatePresence mode="popLayout">
        <motion.video
          key={slide.video}
          src={slide.video}
          autoPlay muted loop playsInline
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mono-media absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30" />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-4 pb-20 sm:px-8">
        <AnimatePresence mode="wait">
          <motion.div key={index} initial="hidden" animate="visible" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="mb-5 inline-block border border-paper/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em]">
              {slide.kicker}
            </motion.p>
            <h1 className="font-display text-5xl font-black leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
              {slide.lines.map((line, i) => (
                <span key={line} className="mask-line">
                  <motion.span className="block"
                    initial={{ y: "110%" }} animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay: 0.15 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}>
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8 flex flex-wrap gap-4">
              <Link to={slide.cta.to} data-testid="hero-cta-button"
                className="group inline-flex items-center gap-2 bg-paper px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink transition-transform duration-200 hover:scale-[1.03]">
                {slide.cta.label} <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link to="/kit" data-testid="hero-kit-button"
                className="inline-flex items-center gap-2 border border-paper/60 px-8 py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] transition-colors duration-200 hover:bg-paper hover:text-ink">
                Style Your Kit
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-6 right-4 flex gap-2 sm:right-8" data-testid="hero-carousel-dots">
          {SLIDES.map((_, i) => (
            <button key={i} data-testid={`hero-dot-${i}`} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`}
              className={`h-1 transition-all duration-500 ${i === index ? "w-10 bg-paper" : "w-4 bg-paper/40 hover:bg-paper/70"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
