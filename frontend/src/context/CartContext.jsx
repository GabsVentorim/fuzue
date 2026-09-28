import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import brand from '../brand';

const CartContext = createContext(null);
const STORAGE_KEY = 'petstore-cart';

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — cart just won't persist */
    }
  }, [items]);

  const keyOf = (i) => `${i.productId}|${i.size || ''}|${i.color || ''}`;

  const add = (product, { size, color, qty = 1 }) => {
    const entry = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      pattern: product.pattern,
      price: product.price,
      size,
      color: color?.name,
      colorHex: color?.hex,
      qty,
    };
    setItems((prev) => {
      const existing = prev.find((i) => keyOf(i) === keyOf(entry));
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i));
      return [...prev, entry];
    });
    setToast(`${product.name} foi pro carrinho!`);
    setTimeout(() => setToast(null), 2200);
  };

  const setQty = (item, qty) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i !== item) : prev.map((i) => (i === item ? { ...i, qty } : i))
    );

  const remove = (item) => setItems((prev) => prev.filter((i) => i !== item));
  const clear = () => setItems([]);

  const totals = useMemo(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const { fee, freeFrom } = brand.shipping;
    const shipping = subtotal === 0 || subtotal >= freeFrom ? 0 : fee;
    return { count, subtotal, shipping, missingForFree: Math.max(0, freeFrom - subtotal) };
  }, [items]);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, toast, ...totals }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
