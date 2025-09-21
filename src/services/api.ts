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

interface Category {
  category_id: number;
  name: string;
  description: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
  created_at: string;
  updated_at: string;
}

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product: Product;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  total: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product: Product;
}

interface Coupon {
  id: number;
  code: string;
  discount: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface DeliveryAddress {
  id: number;
  user_id: number;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}

interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
  customer_name?: string;
}

interface Payment {
  id: number;
  order_id: number;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

interface StaticPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface ProductMedia {
  id: number;
  product_id: number;
  url: string;
  type: string;
  created_at: string;
  updated_at: string;
}

interface Role {
  id: number;
  name: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  try {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to the server');
    }
    throw error;
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchApi<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (name: string, email: string, password: string) =>
      fetchApi<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
    me: () => fetchApi<{ user: User }>('/auth/me'),
  },

  products: {
    getAll: () => fetchApi<Product[]>('/products'),
    getById: (id: number) => fetchApi<Product>(`/products/${id}`),
    search: (query: string) => fetchApi<Product[]>(`/products/search?q=${query}`),
    getByCategory: (categoryId: number) =>
      fetchApi<Product[]>(`/products/category/${categoryId}`),
    getNew: () => fetchApi<Product[]>('/products/new'),
    getBestSelling: () => fetchApi<Product[]>('/products/best-selling'),
    getDeals: () => fetchApi<Product[]>('/products/deals'),
    getDiscounted: () => fetchApi<Product[]>('/products/discounted'),
  },

  categories: {
    getAll: () => fetchApi<Category[]>('/categories'),
    getById: (id: number) => fetchApi<Category>(`/categories/${id}`),
  },

  cart: {
    get: () => fetchApi<Cart>('/carts'),
    addItem: (productId: number, quantity: number) =>
      fetchApi<Cart>('/carts/add', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity }),
      }),
    updateItem: (productId: number, quantity: number) =>
      fetchApi<Cart>(`/carts/item/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      }),
    removeItem: (productId: number) =>
      fetchApi<Cart>(`/carts/item/${productId}`, { method: 'DELETE' }),
    clear: () => fetchApi<{ message: string; itemsRemoved: number }>('/carts/clear', { method: 'DELETE' }),
  },

  orders: {
    getAll: () => fetchApi<Order[]>('/orders'),
    getById: (id: number) => fetchApi<Order>(`/orders/${id}`),
    create: (addressId: number) =>
      fetchApi<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({ address_id: addressId }),
      }),
  },

  users: {
    getAll: () => fetchApi<User[]>('/users'),
    getById: (id: number) => fetchApi<User>(`/users/${id}`),
    update: (id: number, data: { name?: string; email?: string; phone?: string; address?: string; password?: string }) =>
      fetchApi<{ message: string }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    changePassword: (id: number, currentPassword: string, newPassword: string) =>
      fetchApi<{ message: string }>(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
  },

  coupons: {
    getAll: () => fetchApi<Coupon[]>('/coupons'),
    getById: (id: number) => fetchApi<Coupon>(`/coupons/${id}`),
  },

  deliveryAddresses: {
    getAll: () => fetchApi<DeliveryAddress[]>('/delivery-addresses'),
    getById: (id: number) => fetchApi<DeliveryAddress>(`/delivery-addresses/${id}`),
  },

  reviews: {
    getAll: () => fetchApi<Review[]>('/reviews'),
    getById: (id: number) => fetchApi<Review>(`/reviews/${id}`),
    getByProduct: (productId: number) => fetchApi<Review[]>(`/reviews/product/${productId}`),
    getAllUserReviews: () => fetchApi<Review[]>('/reviews'),
  },

  payments: {
    getAll: () => fetchApi<Payment[]>('/payments'),
    getById: (id: number) => fetchApi<Payment>(`/payments/${id}`),
  },

  notifications: {
    getAll: () => fetchApi<Notification[]>('/notifications'),
    getById: (id: number) => fetchApi<Notification>(`/notifications/${id}`),
  },


  productMedia: {
    getAll: () => fetchApi<ProductMedia[]>('/product-media'),
    getById: (id: number) => fetchApi<ProductMedia>(`/product-media/${id}`),
  },

  roles: {
    getAll: () => fetchApi<Role[]>('/roles'),
    getById: (id: number) => fetchApi<Role>(`/roles/${id}`),
  },
};

export type {
  Product,
  Category,
  User,
  Cart,
  CartItem,
  Order,
  OrderItem,
  Coupon,
  DeliveryAddress,
  Review,
  Payment,
  Notification,
  StaticPage,
  ProductMedia,
  Role,
}; 