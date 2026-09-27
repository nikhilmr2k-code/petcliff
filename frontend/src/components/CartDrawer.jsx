import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ArrowRight, Truck, Tag, MapPin } from "lucide-react";
import { useCart, computeKitGroups, KIT_MIN, FREE_SHIPPING } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { formatApiError } from "../lib/api";

export default function CartDrawer() {
  const {
    items, open, setOpen, setQuantity, removeItem,
    subtotal, kitSavings, merchandise, checkout, checkingOut,
    promo, setPromo, applyPromo, zip, quoteTax, taxQuote,
  } = useCart();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [zipInput, setZipInput] = useState(zip || "");
  const [promoBusy, setPromoBusy] = useState(false);

  useEffect(() => {
    const ref = localStorage.getItem("pc_ref");
    if (ref && !promo) setCode(ref);
  }, [promo]);

  const kitGroups = computeKitGroups(items);
  const kitIds = new Set(Object.keys(kitGroups));
  const looseItems = items.filter((i) => !i.kit_id);
  const promoDiscount = promo?.discount || 0;
  const credit = user && user.credit_balance > 0 ? Math.min(user.credit_balance, Math.max(merchandise - promoDiscount, 0)) : 0;
  const shipping = subtotal >= FREE_SHIPPING ? 0 : 8;
  const taxable = Math.max(merchandise - promoDiscount - credit, 0);
  const tax = taxQuote ? Math.round(taxQuote.rate * taxable * 100) / 100 : 0;
  const total = Math.round((taxable + shipping + tax) * 100) / 100;
  const progress = Math.min(subtotal / FREE_SHIPPING, 1);

  const submitPromo = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setPromoBusy(true);
    try {
      const data = await applyPromo(code.trim());
      toast.success(`${data.code} applied — ${data.label}`);
      localStorage.removeItem("pc_ref");
    } catch (err) {
      setPromo(null);
      toast.error(formatApiError(err));
    } finally {
      setPromoBusy(false);
    }
  };

  const submitZip = async (value) => {
    setZipInput(value);
    if (/^\d{5}$/.test(value)) {
      try {
        const q = await quoteTax(value);
        if (q?.state) toast.success(`${q.state} tax rate ${(q.rate * 100).toFixed(2)}% applied`);
      } catch { /* silent */ }
    }
  };

  const renderItem = (item, inKit) => (
    <motion.li key={item.id + (item.kit_id || "")} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }}
      className="flex gap-3" data-testid={`cart-item-${item.id}`}>
      <img src={item.image} alt={item.name} className="mono-media h-16 w-16 border border-line object-cover" />
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-bold uppercase leading-snug tracking-wide">{item.name}</p>
          <button data-testid={`cart-remove-${item.id}`} onClick={() => removeItem(item.id, item.kit_id)} className="text-steel transition-colors hover:text-ink" aria-label="Remove">
            <Trash2 size={13} />
          </button>
        </div>
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <div className="flex items-center gap-2.5 border border-line px-2 py-1">
            <button data-testid={`cart-minus-${item.id}`} onClick={() => setQuantity(item.id, item.kit_id, item.quantity - 1)} aria-label="Decrease"><Minus size={11} /></button>
            <span className="w-4 text-center font-mono text-[11px]">{item.quantity}</span>
            <button data-testid={`cart-plus-${item.id}`} onClick={() => setQuantity(item.id, item.kit_id, Math.min(item.quantity + 1, item.stock))} aria-label="Increase"><Plus size={11} /></button>
          </div>
          <span className="font-mono text-xs font-bold">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    </motion.li>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div data-testid="cart-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)} className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" />
          <motion.aside data-testid="cart-drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-ink bg-paper shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="font-display text-lg font-black uppercase tracking-wide">Your Cart</h2>
              <button data-testid="cart-close-button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center border border-line transition-colors hover:bg-ink hover:text-paper" aria-label="Close cart">
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-line px-6 py-3.5">
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-steel">
                <Truck size={13} />
                {subtotal >= FREE_SHIPPING ? "Free US shipping unlocked" : `$${(FREE_SHIPPING - subtotal).toFixed(2)} from free shipping`}
              </div>
              <div className="h-1 bg-smoke">
                <motion.div className="h-full bg-ink" animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.4 }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4" data-lenis-prevent>
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="font-display text-xl font-black uppercase">Cart is empty.</p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-steel">Your pet is watching. Fix that.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(kitGroups).map(([kitId, kitItems]) => {
                    const unlocked = kitItems.length >= KIT_MIN;
                    const kitTotal = kitItems.reduce((s, i) => s + i.price * i.quantity, 0);
                    return (
                      <div key={kitId} className="border border-ink p-3" data-testid={`cart-kit-${kitId}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="bg-ink px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-paper">Styled Kit · {kitItems.length} items</span>
                          {unlocked ? (
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest" data-testid={`cart-kit-savings-${kitId}`}>−20% · Save ${(kitTotal * 0.2).toFixed(2)}</span>
                          ) : (
                            <span className="font-mono text-[10px] uppercase tracking-widest text-steel">Add {KIT_MIN - kitItems.length} more for −20%</span>
                          )}
                        </div>
                        <ul className="space-y-4"><AnimatePresence initial={false}>{kitItems.map((i) => renderItem(i, true))}</AnimatePresence></ul>
                      </div>
                    );
                  })}
                  <ul className="space-y-4"><AnimatePresence initial={false}>{looseItems.map((i) => renderItem(i, false))}</AnimatePresence></ul>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-ink px-6 py-5 pb-24 sm:pb-5">
                <form onSubmit={submitPromo} className="mb-3 flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
                    <input data-testid="cart-promo-input" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="PROMO / REFERRAL CODE"
                      className="w-full border border-line bg-paper py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-widest outline-none focus:border-ink" />
                  </div>
                  <button data-testid="cart-promo-apply-button" disabled={promoBusy}
                    className="border border-ink px-4 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-ink hover:text-paper disabled:opacity-50">
                    {promoBusy ? "…" : "Apply"}
                  </button>
                </form>
                <div className="relative mb-4">
                  <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-steel" />
                  <input data-testid="cart-zip-input" value={zipInput} onChange={(e) => submitZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="DELIVERY ZIP (FOR US STATE TAX)"
                    className="w-full border border-line bg-paper py-2.5 pl-9 pr-3 font-mono text-xs uppercase tracking-widest outline-none focus:border-ink" />
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-steel"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  {kitSavings > 0 && <div className="flex justify-between font-bold" data-testid="cart-kit-savings"><span>Kit savings (−20%)</span><span>−${kitSavings.toFixed(2)}</span></div>}
                  {promoDiscount > 0 && (
                    <div className="flex justify-between font-bold" data-testid="cart-promo-discount">
                      <span className="flex items-center gap-2">{promo.code} <button onClick={() => { setPromo(null); setCode(""); }} className="text-steel hover:text-ink" aria-label="Remove promo"><X size={11} /></button></span>
                      <span>−${promoDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {credit > 0 && <div className="flex justify-between font-bold" data-testid="cart-credit-applied"><span>Cliff credit</span><span>−${credit.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-steel"><span>Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
                  <div className="flex justify-between text-steel">
                    <span>Est. tax {taxQuote ? `(${taxQuote.state} ${(taxQuote.rate * 100).toFixed(2)}%)` : "(enter ZIP)"}</span>
                    <span data-testid="cart-tax-amount">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 font-display text-base font-black" data-testid="cart-total">
                    <span>Total</span><span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <motion.button data-testid="cart-checkout-button" whileTap={{ scale: 0.97 }} onClick={checkout} disabled={checkingOut}
                  className="mt-4 flex w-full items-center justify-center gap-2 bg-ink py-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-60">
                  {checkingOut ? "Preparing secure checkout…" : (<>Express Checkout <ArrowRight size={15} /></>)}
                </motion.button>
                <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-widest text-steel">
                  Apple Pay · Google Pay · Visa · MC · AMEX · Discover — test card 4242 4242 4242 4242
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
