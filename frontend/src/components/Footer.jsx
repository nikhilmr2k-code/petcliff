import { useState } from "react";
import { Link } from "react-router-dom";
import { Youtube, Instagram, Facebook } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiError } from "../lib/api";
import Reveal from "./Reveal";

const TikTokIcon = (props) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const SnapchatIcon = (props) => (
  <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.03 2c2.53 0 4.63 1.82 4.9 4.3l.04.5.01 1.29c.4.14.83.07 1.19-.04a.87.87 0 0 1 1.02.5c.18.4-.03.82-.45 1.05-.5.27-1.25.55-1.44.84-.14.2-.1.46.13.96 1.25 2.63 2.7 4 4.36 4.32.37.07.6.42.53.8a.8.8 0 0 1-.42.56c-.87.42-1.9.62-2.62.72-.13.24-.25.6-.33.86-.07.23-.12.4-.15.44-.12.17-.4.2-1.03.04-.55-.15-1.1-.22-1.6-.13-.34.06-.7.25-1.11.5-.83.51-1.9 1.16-3.03 1.16h-.12c-1.12 0-2.2-.65-3.03-1.16-.4-.25-.76-.44-1.1-.5-.5-.09-1.06-.02-1.61.13-.63.17-.91.13-1.03-.04-.03-.04-.08-.21-.15-.44-.08-.26-.2-.62-.33-.86-.72-.1-1.75-.3-2.62-.72a.8.8 0 0 1-.42-.56.78.78 0 0 1 .53-.8c1.66-.32 3.1-1.7 4.36-4.32.23-.5.27-.76.13-.96-.19-.29-.94-.57-1.44-.84a.86.86 0 0 1-.45-1.05.87.87 0 0 1 1.02-.5c.36.11.8.18 1.19.04l.01-1.3.04-.49A5.03 5.03 0 0 1 12.03 2z" />
  </svg>
);

const SOCIALS = [
  { label: "YouTube", href: "https://youtube.com", Icon: Youtube, testid: "social-youtube" },
  { label: "TikTok", href: "https://tiktok.com", Icon: TikTokIcon, testid: "social-tiktok" },
  { label: "Snapchat", href: "https://snapchat.com", Icon: SnapchatIcon, testid: "social-snapchat" },
  { label: "Instagram", href: "https://instagram.com", Icon: Instagram, testid: "social-instagram" },
  { label: "Facebook", href: "https://facebook.com", Icon: Facebook, testid: "social-facebook" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("You're on the list. Welcome to the pack.");
      setEmail("");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="bg-ink text-paper" data-testid="site-footer">
      <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:py-20">
        <Reveal>
          <div className="grid grid-cols-1 gap-12 border-b border-neutral-800 pb-14 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="font-display text-3xl font-black tracking-[0.08em]">PET CLIFF</div>
              <p className="mt-3 max-w-sm font-mono text-[11px] uppercase leading-relaxed tracking-[0.2em] text-neutral-400">
                Where pets thrive, homes come alive
              </p>
              <form onSubmit={subscribe} className="mt-8 flex max-w-md border border-neutral-700">
                <input data-testid="newsletter-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL FOR DROPS & OFFERS"
                  className="w-full bg-transparent px-4 py-3.5 font-mono text-xs uppercase tracking-widest outline-none placeholder:text-neutral-600" />
                <button data-testid="newsletter-subscribe-button" disabled={busy}
                  className="shrink-0 bg-paper px-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink transition-colors hover:bg-neutral-200 disabled:opacity-50">
                  {busy ? "…" : "Subscribe"}
                </button>
              </form>
              <div className="mt-8 flex gap-3">
                {SOCIALS.map(({ label, href, Icon, testid }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" data-testid={testid} aria-label={label}
                    className="flex h-10 w-10 items-center justify-center border border-neutral-700 transition-colors duration-200 hover:bg-paper hover:text-ink">
                    <Icon size={17} />
                  </a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Shop by Pet</div>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/shop?pet=dog" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Dog</Link></li>
                  <li><Link to="/shop?pet=cat" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Cat</Link></li>
                </ul>
              </div>
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Shop by Product</div>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/shop?group=walking" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Walking Gear</Link></li>
                  <li><Link to="/shop?group=resting" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Resting</Link></li>
                  <li><Link to="/shop?group=grooming" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Grooming</Link></li>
                  <li><Link to="/shop?group=toys" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Toys</Link></li>
                  <li><Link to="/shop?group=accessories" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Accessories</Link></li>
                </ul>
              </div>
              <div>
                <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">Pet Cliff</div>
                <ul className="space-y-2.5 text-sm">
                  <li><Link to="/kit" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Style Your Kit</Link></li>
                  <li><Link to="/account" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Account & Orders</Link></li>
                  <li><Link to="/account" className="text-neutral-300 transition-colors hover:text-paper hover:underline">Give $10, Get $10</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
        <div className="flex flex-col items-start justify-between gap-3 pt-8 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500 sm:flex-row sm:items-center">
          <span>© 2026 Pet Cliff — petcliff.com</span>
          <span>AI shopping assistant arrives January 2027</span>
        </div>
      </div>
    </footer>
  );
}
