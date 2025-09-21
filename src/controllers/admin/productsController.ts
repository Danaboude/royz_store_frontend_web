import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProducts, createProduct, updateProduct, deleteProduct } from '@/services/admin-api';

export interface Product {
  product_id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category_id: number;
  vendor_id: number;
  is_new: boolean;
  is_best_selling: boolean;
  is_deal_offer: boolean;
  original_price?: number;
  discount_percentage?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  final_price?: number;
  has_active_discount?: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export function useAdminProducts(page = 1, limit = 20, search = '', deleted = 0) {
  return useQuery({
    queryKey: ['admin-products', page, limit, search, deleted],
    queryFn: ({ queryKey }) => {
      const [, page, limit, search, deleted] = queryKey as [string, number, number, string, number];
      return getAdminProducts({ page, limit, search, deleted });
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, product }: { id: number; product: Product }) =>
      updateProduct(id, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
} 