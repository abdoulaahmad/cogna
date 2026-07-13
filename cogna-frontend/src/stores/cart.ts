import { create } from 'zustand';
import type { Product } from '@/components/product/product-card';

interface CartState {
  cartItem: Product | null;
  
  // Actions
  setCartItem: (product: Product | null) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  cartItem: null,

  setCartItem: (cartItem) => set({ cartItem }),
  clearCart: () => set({ cartItem: null }),
}));

export default useCartStore;
