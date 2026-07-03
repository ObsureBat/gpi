import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.getCart();
      setCart(data);
    } catch {
      setCart({ items: [], subtotal_cents: 0, item_count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = async (productId, quantity = 1) => {
    await api.addToCart(productId, quantity);
    await refresh();
  };

  const updateQty = async (productId, quantity) => {
    await api.updateCart(productId, quantity);
    await refresh();
  };

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addToCart, updateQty }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart outside CartProvider');
  return ctx;
}
