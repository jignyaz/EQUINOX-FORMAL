import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (product_id: number) => void;
  updateQuantity: (product_id: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find(i => i.product_id === newItem.product_id);
        if (existingItem) {
          return {
            items: state.items.map(i => 
              i.product_id === newItem.product_id 
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          };
        }
        return { items: [...state.items, { ...newItem, quantity: 1 }] };
      }),
      removeItem: (product_id) => set((state) => ({
        items: state.items.filter(i => i.product_id !== product_id)
      })),
      updateQuantity: (product_id, quantity) => set((state) => ({
        items: state.items.map(i => 
          i.product_id === product_id ? { ...i, quantity } : i
        )
      })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
    }),
    {
      name: 'techstore-cart',
    }
  )
);
