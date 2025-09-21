import create from 'zustand';

interface Product {
  product_id: number;
  vendor_id: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  image_url: string;
  category_name: string;
  vendor_name: string;
  average_rating: number;
  review_count: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  original_price: string | null;
  discount_percentage: number | null;
  discount_start_date: string | null;
  discount_end_date: string | null;
  final_price: string;
  has_active_discount: boolean;
}

interface ProductStoreState {
  cart: Product[];
  favorites: number[];
  productDetails: Record<number, Product>;
  addToCart: (product: Product) => void;
  removeFromCart: (product_id: number) => void;
  addFavorite: (product_id: number) => void;
  removeFavorite: (product_id: number) => void;
  setProductDetails: (product: Product) => void;
}

export const useProductStore = create<ProductStoreState>((set) => ({
  cart: [],
  favorites: [],
  productDetails: {},
  addToCart: (product) => set((state) => {
    if (state.cart.find((p) => p.product_id === product.product_id)) return state;
    return { cart: [...state.cart, product] };
  }),
  removeFromCart: (product_id) => set((state) => ({
    cart: state.cart.filter((p) => p.product_id !== product_id),
  })),
  addFavorite: (product_id) => set((state) => {
    if (state.favorites.includes(product_id)) return state;
    return { favorites: [...state.favorites, product_id] };
  }),
  removeFavorite: (product_id) => set((state) => ({
    favorites: state.favorites.filter((id) => id !== product_id),
  })),
  setProductDetails: (product) => set((state) => ({
    productDetails: { ...state.productDetails, [product.product_id]: product },
  })),
})); 