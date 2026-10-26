import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  // { [menuItemId]: quantity } and { [menuItemId]: customisation note }
  const [items, setItems] = useState({});
  const [notes, setNotes] = useState({});

  const api = useMemo(() => ({
    items,
    notes,
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
      if (qty <= 0) setNotes((n) => { const next = { ...n }; delete next[id]; return next; });
    },
    setNote(id, text) {
      setNotes((n) => ({ ...n, [id]: text }));
    },
    clear() { setItems({}); setNotes({}); },
  }), [items, notes]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
