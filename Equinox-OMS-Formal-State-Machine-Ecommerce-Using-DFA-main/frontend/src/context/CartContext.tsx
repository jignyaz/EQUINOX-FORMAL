'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type CartItem = {
  id: number; name: string; price: number; quantity: number; image_url?: string;
};

type CartContextType = {
  items: CartItem[];
  total: number;
  addToCart: (product: any) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('techstore_cart');
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem('techstore_cart', JSON.stringify(items));
  }, [items]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = (product: any) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, image_url: product.image_url }];
    });
  };

  const removeFromCart = (id: number) => setItems(prev => prev.filter(i => i.id !== id));

  const updateQuantity = (id: number, qty: number) => {
    if (qty <= 0) { removeFromCart(id); return; }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider value={{ items, total, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
