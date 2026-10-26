import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // { [menuItemId]: quantity }
  const [items, setItems] = useState({});

  const api = useMemo(() => ({
    items,
    count: Object.values(items).reduce((a, b) => a + b, 0),
    add(id) {
      setItems((s) => ({ ...s, [id]: (s[id] || 0) + 1 }));
    },
    setQty(id, qty) {
      setItems((s) => {
        const next = { ...s };
        if (qty <= 0) delete next[id];
        else next[id] = qty;
        return next;
      });
    },
    clear() { setItems({}); },
  }), [items]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
