const PHRASES = [
  "Where Pets Thrive, Homes Come Alive",
  "Free US Shipping Over $100",
  "Give $10, Get $10",
  "Style Your Kit — Save 20%",
  "Monochrome. Always.",
];

export default function Marquee() {
  const row = [...PHRASES, ...PHRASES];
  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-3.5 text-paper" data-testid="editorial-marquee">
      <div className="animate-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {[...row, ...row].map((p, i) => (
          <span key={i} className="flex items-center gap-12 font-mono text-[11px] uppercase tracking-[0.3em]">
            {p} <span className="text-steel">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
