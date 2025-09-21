import { apiClient } from './api-client';
import { useQuery } from '@tanstack/react-query';

export interface DeliveryOrder {
  order_id: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total: string;
  status: string;
  placed_at: string;
  estimated_delivery_time?: string;
  actual_delivery_time?: string;
  delivery_notes?: string;

  items?: Array<{
    product_name: string;
    quantity: number;
    price: number;
    vendor_address: string;
    vendor_phone: string;
  }>;

  vendor_addresses?:
  | { address: string; phone: string }
  | Array<{ address: string; phone: string }>;

  // Keep existing optional fields
  split_group_id?: number;
  customer_id?: number;
  vendor_id?: number;
  address_id?: number;
  coupon_id?: number;
  subtotal?: string;
  discount_amount?: string;
  tax_amount?: string;
  confirmation_status?: string;
  confirmed_at?: string;
  delivery_id?: number;
  delivery_zone_id?: number;
  delivery_fee?: string;
  delivery_zone_name?: string;
  delivery_phone?: string;
}

export interface DeliveryStats {
  total_orders: number;
  completed_orders: number;
  active_orders: number;
  avg_delivery_time: number;
  total_revenue: number;
  today_deliveries: number;
  today_assigned_orders: number;
  today_revenue: number;
  this_month_revenue: number;
  this_week_deliveries: number;
  this_month_deliveries: number;
  earnings: {
    total_earnings: number;
    this_month_earnings: number;
    this_week_earnings: number;
    today_earnings: number;
  };
  recent_earnings: Array<{
    earnings_id: number;
    order_id: number;
    delivery_fee: number;
    earnings_amount: number;
    status: string;
    earned_at: string;
    zone_name: string;
    order_total: number;
  }>;
}

export interface DeliveryPersonnel {
  delivery_id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  zone_id: number;
  zone_name_ar: string;
  zone?: string; // Alternative field name for zone name
  vehicle_type: string;
  vehicle_number: string;
  is_available: boolean;
  is_verified: boolean;
  rating: number;
  total_deliveries: number;
  created_at: string;
  updated_at: string;
}

// React Query hooks for delivery API
export const useMyDeliveries = (status?: string) => {
  return useQuery({
    queryKey: ['delivery', 'my-deliveries', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await apiClient.get('/delivery/my-deliveries', { params });
      return response.data.data || [];
    },
    staleTime: 30 * 1000, // 30 seconds - short cache for delivery data
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useDeliveryStats = () => {
  return useQuery({
    queryKey: ['delivery', 'stats'],
    queryFn: async () => {
      const response = await apiClient.get('/delivery/stats');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useDeliveryEarnings = (period: string = 'all', page: number = 1) => {
  return useQuery({
    queryKey: ['delivery', 'earnings', period, page],
    queryFn: async () => {
      const response = await apiClient.get('/delivery/earnings', {
        params: { period, page, limit: 20 }
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Legacy functions for backward compatibility
export const getMyDeliveries = async (): Promise<DeliveryOrder[]> => {
  const response = await apiClient.get('/delivery/my-deliveries');
  return response.data.data || [];
};

// Update delivery status
export const updateDeliveryStatus = async (
  orderId: number,
  status: 'picked_up' | 'in_transit' | 'delivered' | 'failed',
  notes?: string,
  imageFile?: File
): Promise<{ message: string }> => {
  const formData = new FormData();
  formData.append('order_id', orderId.toString());
  formData.append('status', status);

  if (notes) {
    formData.append('notes', notes);
  }

  if (imageFile) {
    formData.append('delivery_confirmation_image', imageFile);
  }

  const response = await apiClient.put('/delivery/orders/status', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Update availability
export const updateAvailability = async (isAvailable: boolean): Promise<{ message: string }> => {
  const response = await apiClient.put('/delivery/availability', {
    is_available: isAvailable
  });
  return response.data;
};

// Get delivery statistics
export const getDeliveryStats = async (): Promise<DeliveryStats> => {
  const response = await apiClient.get('/delivery/stats');
  return response.data.data;
};

// Get delivery personnel profile
export const getDeliveryProfile = async (): Promise<DeliveryPersonnel> => {
  const response = await apiClient.get('/delivery/profile');
  return response.data;
};

// Update delivery personnel profile
export const updateDeliveryProfile = async (data: {
  vehicle_type?: string;
  vehicle_number?: string;
  zone_id?: number;
}): Promise<{ message: string }> => {
  const response = await apiClient.put('/delivery/profile', data);
  return response.data;
};

// Get delivery personnel list (for delivery personnel to view other personnel)
export const getDeliveryPersonnelList = async (): Promise<DeliveryPersonnel[]> => {
  const response = await apiClient.get('/delivery/personnel');
  return response.data.data || [];
};

// Add delivery personnel (for delivery personnel to add new personnel)
export const addDeliveryPersonnel = async (personnel: Partial<DeliveryPersonnel>): Promise<{ message: string }> => {
  const response = await apiClient.post('/delivery/personnel', personnel);
  return response.data;
};

// Update delivery personnel (for delivery personnel to update personnel)
export const updateDeliveryPersonnel = async (id: number, personnel: Partial<DeliveryPersonnel>): Promise<{ message: string }> => {
  const response = await apiClient.put(`/delivery/personnel/${id}`, personnel);
  return response.data;
};

// Delete delivery personnel (for delivery personnel to delete personnel)
export const deleteDeliveryPersonnel = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/delivery/personnel/${id}`);
  return response.data;
};

// Get delivery zones (for delivery personnel to select zones)
export const getDeliveryZones = async (): Promise<Array<{ zone_id: number; name_en: string; name_ar: string; name?: string; delivery_fee: number; estimated_delivery_time: number }>> => {
  const response = await apiClient.get('/delivery/zones');
  return response.data.data || [];
};

// =====================================================
// DELIVERY CLAIM SYSTEM API FUNCTIONS
// =====================================================

// Interface for available orders for claim
export interface AvailableOrderForClaim {
  order_id: number;
  customer_id: number;
  total: string;
  delivery_fee: string;
  status: string;
  placed_at: string;
  delivery_zone_id: number;
  zone_name: string;
  zone_name_ar: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_phone: string;
  is_claimed: number;
  claim_status?: string;
  claimed_at?: string;
  claimed_by_delivery_id?: number;
  claimed_by_name?: string;
  can_claim: number;
}

// Interface for claimed orders
export interface ClaimedOrder {
  order_id: number;
  customer_id: number;
  total: string;
  delivery_fee: string;
  status: string;
  placed_at: string;
  delivery_zone_id: number;
  zone_name: string;
  zone_name_ar: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  delivery_phone: string;
  claim_id: number;
  claim_status: string;
  claimed_at: string;
  approved_at?: string;
  claim_notes?: string;
  delivery_id: number;
  vehicle_type: string;
  vehicle_number: string;
}

// Get available orders for delivery personnel to claim
export const getAvailableOrdersForClaim = async (page: number = 1, limit: number = 20): Promise<{
  orders: AvailableOrderForClaim[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}> => {
  const response = await apiClient.get('/delivery/available-orders', {
    params: { page, limit }
  });
  return response.data.data;
};

// Claim an order for delivery
export const claimOrder = async (orderId: number, notes?: string): Promise<{
  message: string;
  data: {
    order_id: number;
    delivery_id: number;
    claimed_at: string;
  };
}> => {
  const response = await apiClient.post(`/delivery/orders/${orderId}/claim`, {
    notes: notes || null
  });
  return response.data;
};

// Cancel a claimed order
export const cancelClaim = async (orderId: number): Promise<{
  message: string;
  data: {
    order_id: number;
    delivery_id: number;
  };
}> => {
  const response = await apiClient.delete(`/delivery/orders/${orderId}/claim`);
  return response.data;
};

// Get delivery personnel's claimed orders
export const getMyClaimedOrders = async (
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{
  orders: ClaimedOrder[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}> => {
  const params: { page: number; limit: number; status?: string } = { page, limit };
  if (status) params.status = status;

  const response = await apiClient.get('/delivery/my-claimed-orders', { params });
  return response.data.data;
};

// Check if delivery personnel can claim an order
export const checkCanClaimOrder = async (orderId: number): Promise<{
  order_id: number;
  delivery_id: number;
  can_claim: boolean;
}> => {
  const response = await apiClient.get(`/delivery/orders/${orderId}/can-claim`);
  return response.data.data;
};

// React Query hooks for claim system
export const useAvailableOrdersForClaim = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['delivery', 'available-orders', page, limit],
    queryFn: async () => {
      return await getAvailableOrdersForClaim(page, limit);
    },
    staleTime: 10 * 1000, // 10 seconds - very short cache for real-time data
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
};

export const useMyClaimedOrders = (page: number = 1, limit: number = 20, status?: string) => {
  return useQuery({
    queryKey: ['delivery', 'my-claimed-orders', page, limit, status],
    queryFn: async () => {
      return await getMyClaimedOrders(page, limit, status);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

export const useCanClaimOrder = (orderId: number) => {
  return useQuery({
    queryKey: ['delivery', 'can-claim', orderId],
    queryFn: async () => {
      return await checkCanClaimOrder(orderId);
    },
    staleTime: 5 * 1000, // 5 seconds
    enabled: !!orderId, // Only run if orderId is provided
  });
};

// =====================================================
// END OF DELIVERY CLAIM SYSTEM API FUNCTIONS
// ===================================================== 