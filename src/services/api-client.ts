import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useUIStore } from '@/store/uiStore';
import type { SubscriptionPackage } from '@/views/admin/SubscriptionPackagesTable';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // TODO: Show login modal or handle unauthenticated state here
    }
    return Promise.reject(error);
  }
);

// Product hooks
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useNewProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['products', 'new', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/new?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useBestSellingProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['products', 'best-selling', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/best-selling?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useDealProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['products', 'deals', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/deals?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDiscountedProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['products', 'discounted', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/discounted?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchProducts = (query: string, category?: string, limit?: number) => {
  return useQuery({
    queryKey: ['products', 'search', query, category, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        ...(category && category !== 'all' && { category }),
        ...(limit && { limit: limit.toString() }),
      });
      const { data } = await apiClient.get(`/products/search?${params.toString()}`);
      return data;
    },
    enabled: !!query && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Category hooks
export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories');
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Cart hooks
export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const { data } = await apiClient.get('/carts');
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export function useAddToCart() {
  const mutation = useMutation({
    mutationFn: async (variables: { product_id: number; quantity?: number }) => {
      const { product_id, quantity = 1 } = variables;
      const res = await apiClient.post('/carts/add', { product_id, quantity });
      return res.data;
    }
  });
  return mutation;
}

// User hooks
// Removed useUser hook since user data is stored locally in UserContext

export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data } = await apiClient.post('/auth/signin', { email, password });
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // No need to invalidate user queries since we're using local context
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      const { data } = await apiClient.post('/auth/signup', { name, email, password });
      return data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      // No need to invalidate user queries since we're using local context
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // No backend logout endpoint, just clear local storage
      localStorage.removeItem('token');
    },
    onSuccess: () => {
      localStorage.removeItem('token');
      queryClient.clear();
    },
  });
};

// Prefetch functions for better UX
export const prefetchProduct = async (id: number) => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/${id}`);
      return data;
    },
  });
};

export const prefetchProducts = async () => {
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/products');
      return data;
    },
  });
};

// Favorite hooks
export const useFavorites = (enabled = true) => {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await apiClient.get('/favorites');
      return data as number[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    enabled: enabled,
  });
};

export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product_id: number) => {
      const { data } = await apiClient.post('/favorites', { product_id });
      return data;
    },
    onMutate: async (product_id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData(['favorites']);

      // Optimistically update to the new value
      queryClient.setQueryData(['favorites'], (old: number[] = []) => {
        return [...old, product_id];
      });

      // Return a context object with the snapshotted value
      return { previousFavorites };
    },
    onError: (err, product_id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorited-products'] });
    },
  });
};

export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product_id: number) => {
      const { data } = await apiClient.delete(`/favorites/${product_id}`);
      return data;
    },
    onMutate: async (product_id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      // Snapshot the previous value
      const previousFavorites = queryClient.getQueryData(['favorites']);

      // Optimistically update to the new value
      queryClient.setQueryData(['favorites'], (old: number[] = []) => {
        return old.filter(id => id !== product_id);
      });

      // Return a context object with the snapshotted value
      return { previousFavorites };
    },
    onError: (err, product_id, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousFavorites) {
        queryClient.setQueryData(['favorites'], context.previousFavorites);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['favorited-products'] });
    },
  });
};

// Hook to fetch favorited products with full details
export const useFavoritedProducts = (enabled = true) => {
  return useQuery({
    queryKey: ['favorited-products'],
    queryFn: async () => {
      const { data } = await apiClient.get('/favorites/products');
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 3,
    enabled: enabled,
  });
};

export const clearCart = async () => {
  return apiClient.delete('/carts/clear');
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const clearCartStore = useUIStore((state) => state.clearCart);

  return useMutation({
    mutationFn: async (clearBackend: boolean = true): Promise<void> => {
      await clearCartStore(clearBackend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });

};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const { removeFromCart } = useUIStore();

  return useMutation({
    mutationFn: async (product_id: number) => {
      // Use the Zustand store method which handles both backend and localStorage
      await removeFromCart(product_id);
    },
    onSuccess: () => {
      // Invalidate cart queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ product_id, quantity }: { product_id: number; quantity: number }) => {
      // Make direct API call to get response data
      const { data } = await apiClient.put(`/carts/item/${product_id}`, { quantity });
      return data;
    },
    onSuccess: () => {
      // Invalidate cart queries to ensure UI is updated
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    }
  });
};

export interface CreateOrderPayload {
  delivery_address_id: number;
  delivery_zone_id?: number;
  delivery_fee?: number;
  payment_method: string;
  coupon_code?: string;
  // Add other fields as needed
}

export const createOrder = async (orderPayload: CreateOrderPayload) => {
  const { data } = await apiClient.post('/orders', orderPayload);
  return data;
};
export const createOrderotp = async (phone: string) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  if (!user) {
    throw new Error("User  not found in localStorage");
  }
  console.log("Sending OTP with the following details:", {
    userId: user.id,
    email: user.email,
    phone: phone,
    type: 'order_creation'
  });
  try {
    const { data } = await apiClient.post('/orders/sendorderotp', {
      userId: user.id,
      email: user.email,
      phone: phone,
      type: 'order_creation'
    });
    console.log("Response from server:", data);
    return data;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error; // Rethrow the error for further handling
  }
};

export const useGiftProducts = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['products', 'gift', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/products/gift?page=${page}&limit=${limit}`);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useHomeData = () => {
  return useQuery({
    queryKey: ['home-data'],
    queryFn: async () => {
      const { data } = await apiClient.get('/home');
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Delivery zones hook
export const useDeliveryZones = () => {
  return useQuery({
    queryKey: ['delivery-zones'],
    queryFn: async () => {
      const { data } = await apiClient.get('/delivery/zones');
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Calculate delivery fee hook
export const useCalculateDeliveryFee = () => {
  return useMutation({
    mutationFn: async ({ zone_id }: { zone_id: number }) => {
      const { data } = await apiClient.post('/delivery/calculate-fee', { zone_id });
      return data;
    },
  });
};

// Subscription Packages API
export const subscriptionPackagesApi = {
  getAll: () => apiClient.get<SubscriptionPackage[]>('/subscriptions/packages'),
  create: (data: Omit<SubscriptionPackage, 'package_id' | 'created_at'>) => apiClient.post<SubscriptionPackage>('/subscriptions/packages', data),
  update: (id: number, data: Partial<Omit<SubscriptionPackage, 'package_id' | 'created_at'>>) => apiClient.put<SubscriptionPackage>(`/subscriptions/packages/${id}`, data),
  delete: (id: number) => apiClient.delete(`/subscriptions/packages/${id}`),
  getVendorTypes: () => apiClient.get('/subscriptions/vendor-types'),
};

// Helper: Check if user is vendor
export function isVendorRole(roleId: number) {
  return [3, 4, 5].includes(roleId);
}

export async function loginUser(identifier: string, password: string) {
  const { data } = await apiClient.post('/auth/signin', { identifier, password });
  return data; // No token here yet, just confirmation OTP sent
}
export async function logindelivery(identifier: string, password: string) {
  const { data } = await apiClient.post('/auth/signindelivery', { identifier, password });
  return data; // No token here yet, just confirmation OTP sent
}
export async function signupVendor(formData: FormData) {
  const { data } = await apiClient.post('/auth/signupVendor', formData);
  return data;
}




export { apiClient }; 