import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Star } from "lucide-react";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

const GROUP_LABEL = { walking: "Walking Gear", resting: "Resting", grooming: "Grooming", toys: "Toys", accessories: "Accessories" };

export default function ProductModal({ product, onClose }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[80] bg-ink/50 backdrop-blur-sm" data-testid="product-modal-backdrop" />
          <div className="pointer-events-none fixed inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div data-testid="product-modal" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto grid max-h-[90vh] w-full max-w-3xl grid-cols-1 overflow-y-auto border border-ink bg-paper shadow-2xl md:grid-cols-2 md:overflow-hidden"
              data-lenis-prevent>
              <div className="relative h-64 bg-mist md:h-full">
                <img src={product.image} alt={product.name} className="product-media h-full w-full object-cover" />
              </div>
              <div className="relative flex flex-col p-7">
                <button data-testid="product-modal-close" onClick={onClose}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-line transition-colors hover:bg-ink hover:text-paper" aria-label="Close">
                  <X size={16} />
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-steel">
                  {GROUP_LABEL[product.group]} · {product.pet} · {product.color}
                </span>
                <h3 className="mt-2 font-display text-2xl font-black uppercase leading-tight tracking-tight">{product.name}</h3>
                <div className="mt-2 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} className={i < Math.round(product.rating) ? "fill-ink text-ink" : "text-neutral-300"} />
                  ))}
                  <span className="ml-1 font-mono text-xs text-steel">{product.rating?.toFixed(1)}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{product.description}</p>
                <div className="mt-auto pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-display text-2xl font-black">${product.price.toFixed(2)}</span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-steel">
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4 border border-ink px-4 py-3">
                      <button data-testid="product-modal-minus" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Minus size={14} /></button>
                      <span className="w-5 text-center font-mono text-sm" data-testid="product-modal-qty">{qty}</span>
                      <button data-testid="product-modal-plus" onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase"><Plus size={14} /></button>
                    </div>
                    <motion.button data-testid="product-modal-add-button" whileTap={{ scale: 0.97 }}
                      onClick={() => { addItem(product, qty); toast.success(`${product.name} added to cart`); onClose(); }}
                      disabled={product.stock === 0}
                      className="flex-1 bg-ink py-3.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper transition-colors hover:bg-neutral-800 disabled:opacity-40">
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
