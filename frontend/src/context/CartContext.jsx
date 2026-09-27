import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api from "../lib/api";

const CartContext = createContext(null);
const STORAGE_KEY = "pc_cart_v1";
export const KIT_DISCOUNT = 0.2;
export const KIT_MIN = 3;
export const FREE_SHIPPING = 100;

export function computeKitGroups(items) {
  const groups = {};
  for (const i of items) {
    if (i.kit_id) (groups[i.kit_id] = groups[i.kit_id] || []).push(i);
  }
  return groups;
}

export function computeKitSavings(items) {
  let savings = 0;
  for (const g of Object.values(computeKitGroups(items))) {
    if (g.length >= KIT_MIN) savings += g.reduce((s, i) => s + i.price * i.quantity, 0) * KIT_DISCOUNT;
  }
  return Math.round(savings * 100) / 100;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [promo, setPromo] = useState(null); // {code, type, discount, label}
  const [zip, setZip] = useState("");
  const [taxQuote, setTaxQuote] = useState(null); // {state, rate}

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, quantity = 1, kit_id = null) => {
    setItems((prev) => {
      const key = product.id + (kit_id || "");
      const existing = prev.find((i) => i.id + (i.kit_id || "") === key);
      if (existing) {
        return prev.map((i) => i.id + (i.kit_id || "") === key ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, image: product.image, stock: product.stock, group: product.group, quantity, kit_id }];
    });
    setOpen(true);
  }, []);

  const addKit = useCallback((products) => {
    if (!products.length) return;
    const kit_id = `kit-${Date.now().toString(36)}`;
    setItems((prev) => {
      const next = [...prev];
      for (const p of products) {
        next.push({ id: p.id, name: p.name, price: p.price, image: p.image, stock: p.stock, group: p.group, quantity: 1, kit_id });
      }
      return next;
    });
    setOpen(true);
    return kit_id;
  }, []);

  const setQuantity = useCallback((id, kit_id, quantity) => {
    const key = id + (kit_id || "");
    setItems((prev) => quantity <= 0
      ? prev.filter((i) => i.id + (i.kit_id || "") !== key)
      : prev.map((i) => i.id + (i.kit_id || "") === key ? { ...i, quantity } : i));
  }, []);

  const removeItem = useCallback((id, kit_id) => {
    const key = id + (kit_id || "");
    setItems((prev) => prev.filter((i) => i.id + (i.kit_id || "") !== key));
  }, []);

  const clearCart = useCallback(() => { setItems([]); setPromo(null); }, []);

  const subtotal = useMemo(() => Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100, [items]);
  const kitSavings = useMemo(() => computeKitSavings(items), [items]);
  const merchandise = useMemo(() => Math.round((subtotal - kitSavings) * 100) / 100, [subtotal, kitSavings]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const applyPromo = useCallback(async (code) => {
    const { data } = await api.post("/promo/validate", { code, merchandise_total: merchandise });
    setPromo(data);
    return data;
  }, [merchandise]);

  const quoteTax = useCallback(async (zipCode) => {
    setZip(zipCode);
    if (!/^\d{5}$/.test(zipCode)) { setTaxQuote(null); return null; }
    const { data } = await api.get("/tax/quote", { params: { zip: zipCode } });
    setTaxQuote(data.state ? data : null);
    return data;
  }, []);

  const checkout = useCallback(async () => {
    setCheckingOut(true);
    try {
      const { data } = await api.post("/payments/checkout", {
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, kit_id: i.kit_id })),
        origin_url: window.location.origin,
        promo_code: promo?.code || undefined,
        zip: zip || undefined,
      });
      window.location.href = data.checkout_url;
    } finally {
      setCheckingOut(false);
    }
  }, [items, promo, zip]);

  return (
    <CartContext.Provider value={{
      items, addItem, addKit, setQuantity, removeItem, clearCart,
      subtotal, kitSavings, merchandise, count,
      open, setOpen, checkout, checkingOut,
      promo, setPromo, applyPromo, zip, quoteTax, taxQuote,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
