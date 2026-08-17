// src/store/cartStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocalCartItem {
  variant: number; // ID
  quantity: number;
  variant_name: string;
  price: number;
  stock: number;
  image: string | null;
  product_id: number;
}

interface CartState {
  localItems: LocalCartItem[];
  addItem: (item: LocalCartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      localItems: [],
      
      addItem: (newItem) => {
        const currentItems = get().localItems;
        const existingItem = currentItems.find(item => item.variant === newItem.variant);
        
        if (existingItem) {
          // اگر بود، تعدادش رو با رعایت سقف موجودی آپدیت کن
          const newQuantity = Math.min(existingItem.quantity + newItem.quantity, newItem.stock);
          set({
            localItems: currentItems.map(item => 
              item.variant === newItem.variant ? { ...item, quantity: newQuantity } : item
            )
          });
        } else {
          set({ localItems: [...currentItems, newItem] });
        }
      },

      removeItem: (variantId) => {
        set({ localItems: get().localItems.filter(item => item.variant !== variantId) });
      },

      updateQuantity: (variantId, quantity) => {
        set({
          localItems: get().localItems.map(item => 
            item.variant === variantId ? { ...item, quantity: Math.min(quantity, item.stock) } : item
          )
        });
      },

      clearCart: () => set({ localItems: [] }),
    }),
    {
      name: 'myshop-cart-storage', // اسمی که تو LocalStorage ذخیره میشه
    }
  )
);