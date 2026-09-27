import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, User, Menu, X, Search, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const PET_MENU = [
  { label: "DOG", links: [
    ["Harnesses", "/shop?pet=dog&subtype=harness"],
    ["Leashes", "/shop?pet=dog&subtype=leash"],
    ["Collars", "/shop?pet=dog&subtype=collar"],
    ["Resting Beds", "/shop?pet=dog&group=resting"],
    ["Toys", "/shop?pet=dog&group=toys"],
    ["Accessories", "/shop?pet=dog&group=accessories"],
  ]},
  { label: "CAT", links: [
    ["Harness Sets", "/shop?pet=cat&subtype=harness"],
    ["Collars", "/shop?pet=cat&subtype=collar"],
    ["Toys", "/shop?pet=cat&group=toys"],
    ["Accessories", "/shop?pet=cat&group=accessories"],
  ]},
];

const PRODUCT_MENU = [
  ["Walking Gear", "/shop?group=walking", "Y-Harnesses, Bungee Leashes, Collars"],
  ["Resting", "/shop?group=resting", "Orthopedic Bolster Beds"],
  ["Grooming", "/shop?group=grooming", "Slicker Brushes, Combs, Dental Sets"],
  ["Toys", "/shop?group=toys", "Interactive & Enrichment"],
  ["Accessories", "/shop?group=accessories", "Goggles, AirTag Holders, Bottles"],
];

const MENU_IMG = {
  dog: "https://images.pexels.com/photos/27208837/pexels-photo-27208837.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  cat: "https://images.pexels.com/photos/19988807/pexels-photo-19988807.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  product: "https://images.pexels.com/photos/29578723/pexels-photo-29578723.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

const dropdownPanel = "invisible absolute left-0 top-full z-50 translate-y-2 border border-line bg-paper opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100";

export default function Navbar() {
  const { user } = useAuth();
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md" data-testid="main-header">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-10">
          <Link to="/" data-testid="nav-brand-logo" className="font-display text-xl font-black tracking-[0.08em]">
            PET CLIFF
          </Link>
          <nav className="hidden items-center gap-7 lg:flex">
            <div className="group relative py-2">
              <button data-testid="nav-shop-by-pet" className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:text-steel">
                Shop by Pet <ChevronDown size={13} />
              </button>
              <div className={dropdownPanel} data-testid="nav-pet-dropdown">
                <div className="flex gap-10 p-6">
                  {PET_MENU.map((col) => (
                    <div key={col.label}>
                      <div className="mb-3 border-b border-ink pb-2 font-display text-sm font-extrabold tracking-[0.15em]">{col.label}</div>
                      <ul className="space-y-2.5">
                        {col.links.map(([label, to]) => (
                          <li key={label}><Link to={to} className="whitespace-nowrap text-sm text-steel transition-colors hover:text-ink hover:underline">{label}</Link></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="hidden xl:flex gap-4">
                    {["dog", "cat"].map((k) => (
                      <Link key={k} to={`/shop?pet=${k}`} className="group/img relative h-[220px] w-[168px] overflow-hidden">
                        <img src={MENU_IMG[k]} alt={k} className="mono-media h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                        <span className="absolute bottom-3 left-3 bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">Shop {k}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="group relative py-2">
              <button data-testid="nav-shop-by-product" className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:text-steel">
                Shop by Product <ChevronDown size={13} />
              </button>
              <div className={dropdownPanel} data-testid="nav-product-dropdown">
                <div className="flex p-3">
                  <div className="w-[300px]">
                    {PRODUCT_MENU.map(([label, to, sub]) => (
                      <Link key={label} to={to} className="block px-3 py-2.5 transition-colors hover:bg-mist">
                        <div className="text-sm font-semibold">{label}</div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-steel">{sub}</div>
                      </Link>
                    ))}
                  </div>
                  <Link to="/shop" className="group/img relative ml-3 hidden h-[236px] w-[190px] overflow-hidden xl:block">
                    <img src={MENU_IMG.product} alt="Shop all" className="mono-media h-full w-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
                    <span className="absolute bottom-3 left-3 bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">The Collection</span>
                  </Link>
                </div>
              </div>
            </div>
            <Link to="/kit" data-testid="nav-style-your-kit"
              className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-200 hover:bg-ink hover:text-paper">
              Style Your Kit
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button data-testid="nav-search-button" onClick={() => setSearchOpen(true)}
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-mist" aria-label="Search">
            <Search size={18} />
          </button>
          <button data-testid="nav-account-button" onClick={() => navigate("/account")}
            className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-mist" aria-label="Account">
            <User size={18} />
          </button>
          {user && user.role === "admin" && (
            <Link to="/admin" data-testid="nav-admin-link" className="hidden px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-steel hover:text-ink md:block">Admin</Link>
          )}
          <motion.button data-testid="nav-cart-trigger" whileTap={{ scale: 0.93 }} onClick={() => setOpen(true)}
            className="relative flex h-10 items-center gap-2 bg-ink px-4 text-paper transition-colors hover:bg-neutral-800" aria-label="Cart">
            <ShoppingBag size={16} />
            <span className="hidden font-mono text-xs uppercase tracking-widest sm:inline">Cart</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span key="b" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} data-testid="nav-cart-count"
                  className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-ink bg-paper px-1 font-mono text-[10px] font-bold text-ink">
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <button data-testid="nav-mobile-menu-button" className="flex h-10 w-10 items-center justify-center lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="max-h-[70vh] overflow-y-auto border-t border-line lg:hidden" data-lenis-prevent>
            <div className="space-y-6 px-6 py-6">
              {PET_MENU.map((col) => (
                <div key={col.label}>
                  <div className="mb-2 font-display text-sm font-extrabold tracking-[0.15em]">SHOP {col.label}</div>
                  <ul className="space-y-2">
                    {col.links.map(([label, to]) => (
                      <li key={label}><Link to={to} onClick={() => setMobileOpen(false)} className="text-sm text-steel">{label}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <div className="mb-2 font-display text-sm font-extrabold tracking-[0.15em]">SHOP BY PRODUCT</div>
                <ul className="space-y-2">
                  {PRODUCT_MENU.map(([label, to]) => (
                    <li key={label}><Link to={to} onClick={() => setMobileOpen(false)} className="text-sm text-steel">{label}</Link></li>
                  ))}
                </ul>
              </div>
              <Link to="/kit" onClick={() => setMobileOpen(false)} className="block border border-ink py-3 text-center font-mono text-xs uppercase tracking-[0.2em]">Style Your Kit</Link>
              {user && user.role === "admin" && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="block font-mono text-xs uppercase tracking-[0.2em] text-steel">Admin Studio</Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-paper/95 backdrop-blur" data-testid="search-overlay">
            <div className="mx-auto max-w-3xl px-6 pt-32">
              <button data-testid="search-close-button" onClick={() => setSearchOpen(false)} className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center border border-line transition-colors hover:bg-ink hover:text-paper" aria-label="Close search">
                <X size={18} />
              </button>
              <form onSubmit={submitSearch}>
                <input data-testid="search-input" autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH HARNESSES, TOYS, GROOMING…"
                  className="w-full border-b-2 border-ink bg-transparent py-4 font-display text-2xl font-extrabold uppercase tracking-tight outline-none placeholder:text-neutral-300 sm:text-4xl" />
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.25em] text-steel">Press enter to search the collection</p>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
