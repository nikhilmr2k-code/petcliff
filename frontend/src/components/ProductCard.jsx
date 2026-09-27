import { motion } from "framer-motion";
import { Star, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";

export default function ProductCard({ product, onOpen, index = 0 }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    addItem(product);
    setAdded(true);
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdded(false), 1100);
  };

  return (
    <motion.article
      data-testid={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => onOpen && onOpen(product)}
      className="group cursor-pointer border border-line bg-paper transition-colors duration-300 hover:bg-mist"
    >
      <div className="relative aspect-square overflow-hidden">
        <img src={product.image} alt={product.name} loading="lazy"
          className="product-media h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.02]" />
        <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-paper">
          {product.pet}
        </span>
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute right-3 top-3 border border-ink bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
            {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-paper/70 font-mono text-xs uppercase tracking-[0.3em]">Sold out</span>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1.5 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={10} className={i < Math.round(product.rating) ? "fill-ink text-ink" : "text-neutral-300"} />
          ))}
          <span className="ml-1 font-mono text-[10px] text-steel">{product.rating?.toFixed(1)}</span>
        </div>
        <h3 className="font-display text-sm font-medium uppercase leading-snug tracking-[0.04em]">{product.name}</h3>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-steel">{product.color}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-mono text-sm">${product.price.toFixed(2)}</span>
          <motion.button
            data-testid={`product-add-to-cart-button-${product.id}`}
            whileTap={{ scale: 0.88 }}
            onClick={handleAdd}
            disabled={product.stock === 0}
            className={`flex h-9 w-9 items-center justify-center transition-colors duration-200 disabled:opacity-30 ${added ? "bg-ink text-paper" : "border border-ink hover:bg-ink hover:text-paper"}`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check size={15} /> : <Plus size={15} />}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
