import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminOrders, updateOrderStatus } from '@/services/admin-api';

export interface Order {
  order_id: number;
  customer_id: number;
  total_amount: number;
  status: string;
  delivery_address_id: number;
  payment_id: number;
  created_at: string;
  updated_at: string;
  customer_name: string;
  delivery_address: string;
  payment_status: string;
}

export function useAdminOrders(page = 1, limit = 20, search = '') {
  return useQuery({
    queryKey: ['admin-orders', page, limit, search],
    queryFn: ({ queryKey }) => {
      const [, page, limit, search] = queryKey as [string, number, number, string];
      return getAdminOrders({ page, limit, search });
    },
  });
}



export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
} 