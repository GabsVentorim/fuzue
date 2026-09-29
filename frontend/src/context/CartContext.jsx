import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import brand from '../brand';
import { api } from '../api';

const CartContext = createContext(null);
const STORAGE_KEY = 'petstore-cart';
const SHIP_KEY = 'petstore-ship';

const load = (key = STORAGE_KEY, fallback = []) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [toast, setToast] = useState(null);
  // Shipping: real quotes (SuperFrete) when the API has them configured, else the flat fee.
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [ship, setShip] = useState(() => load(SHIP_KEY, { cep: '', option: null }));

  useEffect(() => {
    api.shippingStatus().then((r) => setShippingEnabled(!!r.enabled)).catch(() => setShippingEnabled(false));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SHIP_KEY, JSON.stringify(ship));
    } catch {
      /* ignore */
    }
  }, [ship]);

  // The price depends on what's in the cart — drop the chosen option when the cart changes.
  const itemsKey = items.map((i) => `${i.productId}x${i.qty}`).join(',');
  const prevItemsKey = useRef(itemsKey);
  useEffect(() => {
    if (prevItemsKey.current === itemsKey) return;
    prevItemsKey.current = itemsKey;
    setShip((s) => (s.option ? { ...s, option: null } : s));
  }, [itemsKey]);

  const setShipCep = (cep) => setShip((s) => (s.cep === cep ? s : { cep, option: null }));
  const chooseShipping = (option, cep) => setShip({ cep: cep ?? ship.cep, option });

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
    const flat = subtotal === 0 || subtotal >= freeFrom ? 0 : fee;
    // null = "not calculated yet" when real quotes are on
    const shipping = shippingEnabled ? (ship.option ? ship.option.price : null) : flat;
    return { count, subtotal, shipping, missingForFree: Math.max(0, freeFrom - subtotal) };
  }, [items, shippingEnabled, ship]);

  return (
    <CartContext.Provider
      value={{ items, add, setQty, remove, clear, toast, shippingEnabled, ship, setShipCep, chooseShipping, ...totals }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
