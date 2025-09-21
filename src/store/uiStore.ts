import { create } from 'zustand';
import { api, type User, type Cart } from '@/services/api';
import { defaultTheme, extractThemeColors } from '@/services/theme';

interface UIState {
  // Theme
  theme: {
    main: string;
    light: string;
    dark: string;
  };
  setTheme: (colors: { main: string; light: string; dark: string }) => void;
  extractThemeFromImage: (imageUrl: string) => Promise<void>;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Cart
  cart: Cart | null;
  cartCount: number;
  cartLoaded: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartItem: (productId: number, quantity: number) => Promise<Cart>;
  removeFromCart: (productId: number) => Promise<void>;
  initializeCart: () => void;

  // Loading States
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Coupon
  coupon: { code: string; discount: number } | null;
  setCoupon: (coupon: { code: string; discount: number } | null) => void;

  clearCart: (clearBackend?: boolean) => Promise<void>;
}

function saveCartToLocal(cart: Cart | null) {
  if (typeof window === 'undefined') return;
  if (cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  } else {
    localStorage.removeItem('cart');
  }
}

function loadCartFromLocal(): Cart | null {
  if (typeof window === 'undefined') return null;
  const cartStr = localStorage.getItem('cart');
  if (cartStr) {
    try {
      return JSON.parse(cartStr);
    } catch {
      return null;
    }
  }
  return null;
}

function saveCartCountToLocal(cartCount: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cartCount', String(cartCount));
}

function loadCartCountFromLocal(): number {
  if (typeof window === 'undefined') return 0;
  const cartCountStr = localStorage.getItem('cartCount');
  if (cartCountStr) {
    try {
      return parseInt(cartCountStr, 10);
    } catch {
      return 0;
    }
  }
  return 0;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Theme
  theme: defaultTheme,
  setTheme: (colors) => set({ theme: colors }),
  extractThemeFromImage: async (imageUrl) => {
    try {
      const colors = await extractThemeColors(imageUrl);
      set({ theme: colors });
      // Update CSS variables
      document.documentElement.style.setProperty('--theme-main', colors.main);
      document.documentElement.style.setProperty('--theme-light', colors.light);
      document.documentElement.style.setProperty('--theme-dark', colors.dark);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to extract theme:', errorMessage);
      // Fallback to default theme
      set({ theme: defaultTheme });
    }
  },

  // Auth
  user: null,
  isAuthenticated: false,
  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const { user } = await api.auth.login(email, password);
      set({ user, isAuthenticated: true });
      // Check for admin, vendor, or delivery personnel role
      const isAdminOrVendor = user.role === 'admin' || user.role === 'vendor' || (typeof (user as unknown as { roleId?: number }).roleId === 'number' && [1, 4, 6].includes((user as unknown as { roleId: number }).roleId));
      if (!isAdminOrVendor) {
        await get().fetchCart();
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  register: async (name, email, password) => {
    try {
      set({ isLoading: true });
      const { user } = await api.auth.register(name, email, password);
      set({ user, isAuthenticated: true });
      // Check for admin, vendor, or delivery personnel role
      const isAdminOrVendor = user.role === 'admin' || user.role === 'vendor' || (typeof (user as unknown as { roleId?: number }).roleId === 'number' && [1, 4, 6].includes((user as unknown as { roleId: number }).roleId));
      if (!isAdminOrVendor) {
        await get().fetchCart();
      }
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  logout: async () => {
    try {
      set({ isLoading: true });
      await api.auth.logout();
      set({ user: null, isAuthenticated: false, cart: null, cartCount: 0 });
      // Clear cart data from localStorage
      saveCartToLocal(null);
      saveCartCountToLocal(0);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  checkAuth: async () => {
    try {
      const { user } = await api.auth.me();
      set({ user, isAuthenticated: true });
      // Check for admin, vendor, or delivery personnel role
      const isAdminOrVendor = user.role === 'admin' || user.role === 'vendor' || (typeof (user as unknown as { roleId?: number }).roleId === 'number' && [1, 4, 6].includes((user as unknown as { roleId: number }).roleId));
      if (!isAdminOrVendor) {
        await get().fetchCart();
      }
    } catch (error: unknown) {
      // Don't log auth errors as they're expected when not logged in
      // Only log actual network errors
      if (error instanceof Error && error.message.includes('Network error')) {
        console.warn('Backend server not available:', error.message);
      }
      set({ user: null, isAuthenticated: false, cart: null });
      // Try to load cart from localStorage even when not authenticated
      const localCart = loadCartFromLocal();
      if (localCart) {
        set({ cart: localCart, cartCount: localCart.items.length, cartLoaded: true });
      } else {
        // If no cart in localStorage, try to load just the cart count
        const cartCount = loadCartCountFromLocal();
        if (cartCount > 0) {
          set({ cartCount, cartLoaded: true });
        } else {
          set({ cartLoaded: true });
        }
      }
    }
  },

  // Cart
  cart: null,
  cartCount: 0,
  cartLoaded: false,
  fetchCart: async () => {
        try {
      const cart = await api.cart.get();
      const cartCount = cart.items.length;
      set({ cart, cartCount, cartLoaded: true });
      saveCartToLocal(cart);
      saveCartCountToLocal(cartCount);
          } catch (error) {
      // If backend fails, try to load from localStorage
      const localCart = loadCartFromLocal();
      if (localCart) {
        set({ cart: localCart, cartCount: localCart.items.length, cartLoaded: true });
        saveCartCountToLocal(localCart.items.length);
      } else {
        set({ cartLoaded: true });
      }
      console.error('Failed to fetch cart:', error);
    }
  },
  addToCart: async (productId, quantity) => {
    try {
      set({ isLoading: true });
      const cart = await api.cart.addItem(productId, quantity);
      const cartCount = cart.items.length;
      set({ cart, cartCount });
      saveCartToLocal(cart);
      saveCartCountToLocal(cartCount);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateCartItem: async (productId, quantity) => {
    try {
      set({ isLoading: true });
      const cart = await api.cart.updateItem(productId, quantity);
      const cartCount = cart.items.length;
      set({ cart, cartCount });
      saveCartToLocal(cart);
      saveCartCountToLocal(cartCount);
      
      // Return the response data for handling quantity limitations
      return cart;
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  removeFromCart: async (productId: number) => {
    try {
      set({ isLoading: true });
      const cart = await api.cart.removeItem(productId);
      const cartCount = cart.items.length;
      set({ cart, cartCount });
      saveCartToLocal(cart);
      saveCartCountToLocal(cartCount);
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  initializeCart: () => {
    if (typeof window === 'undefined') return;
    
    const localCart = loadCartFromLocal();
    if (localCart) {
      set({ cart: localCart, cartCount: localCart.items.length, cartLoaded: true });
    } else {
      // If no cart in localStorage, try to load just the cart count
      const cartCount = loadCartCountFromLocal();
      if (cartCount > 0) {
        set({ cartCount, cartLoaded: true });
      } else {
        set({ cartLoaded: true });
      }
    }
  },

  // Loading States
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Coupon
  coupon: null,
  setCoupon: (coupon) => set({ coupon }),

  clearCart: async (clearBackend = false) => {
    // Clear frontend state
    set({ cart: null, cartCount: 0 });
    saveCartToLocal(null);
    saveCartCountToLocal(0);
    
    // Optionally clear backend cart
    if (clearBackend) {
      try {
        await api.cart.clear();
              } catch (error) {
        console.error('Failed to clear cart in backend:', error);
        // Don't throw error as frontend state is already cleared
      }
    }
  },
}));

// Function to initialize cart from localStorage (call this on client side)
export const initializeCartFromStorage = () => {
  if (typeof window === 'undefined') return;
  useUIStore.getState().initializeCart();
}; 