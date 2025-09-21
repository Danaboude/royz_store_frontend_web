import axios from 'axios';
import type { Product } from './admin-api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const vendorApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Add request interceptor to include JWT token
vendorApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('[VENDOR API] Token from storage:', token); // DEBUG LOG
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[VENDOR API] Authorization header set:', config.headers.Authorization); // DEBUG LOG
    } else {
      console.warn('[VENDOR API] No token found in storage!'); // DEBUG LOG
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors (optional, similar to adminApi)
vendorApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed: 401 Unauthorized');
    } else if (error.response?.status === 403) {
      console.error('Authorization failed: 403 Forbidden - Insufficient permissions');
    }
    return Promise.reject(error);
  }
);

// Vendor Analytics API Functions
export async function getVendorAnalyticsById(vendorId: number) {
  const { data } = await vendorApi.get(`/statistics/vendor-analytics/${vendorId}`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch vendor analytics');
  }
  return data.data;
}

export async function getVendorAnalytics() {
  const { data } = await vendorApi.get('/statistics/vendor-analytics');
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch vendor analytics');
  }
  return data.data;
}

// Vendor Products API Functions
export async function getVendorProducts({ page = 1, limit = 20, search = '' }: { page?: number; limit?: number; search?: string }) {
  const params = { page, limit, search };
  const { data } = await vendorApi.get('/vendor/vendor-products', { params });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch vendor products');
  }
  return data.data;
}

export async function addVendorProduct(product: Product) {
  const { data } = await vendorApi.post('/vendor/products', product);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to add product');
  }
  return data.data;
}

export async function editVendorProduct(id: number, product: Product) {
  const { data } = await vendorApi.put(`/vendor/products/${id}`, product);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to update product');
  }
  return data.data;
}

export async function deleteVendorProduct(id: number) {
  const { data } = await vendorApi.delete(`/vendor/products/${id}`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete product');
  }
  return data;
}

export async function importVendorProducts(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await vendorApi.post('/vendor/products/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to import products');
  }
  return data;
}

export async function exportVendorProducts(): Promise<Blob> {
  const response = await vendorApi.get('/vendor/products/export', { responseType: 'blob' });
  if (response.status !== 200) {
    throw new Error('Failed to export products');
  }
  return response.data;
}

export async function uploadVendorProductMedia(productId: number, files: File[]) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('media', file); // use 'media' key to match admin API if needed
  });
    const { data } = await vendorApi.post(`/vendor/products/${productId}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to upload product media');
  }
  return data.data;
}

export async function getVendorOrders({ page = 1, limit = 20, search = '' } = {}) {
      const params = { page, limit, search };
    try {
    const { data } = await vendorApi.get('/orders', { params });
        if (!data.success || !data.data) {
      console.error('API Error - success:', data.success, 'data:', data.data);
      throw new Error(data.message || 'Failed to fetch vendor orders');
    }
    // Return the data object directly (not wrapped in another data property)
    return {
      data: data.data,
      total: data.pagination.total,
      page: data.page,
      pageSize: data.pageSize,
      totalPages: data.totalPages,
      message: data.message
    };
  } catch (error) {
    console.error('Vendor API Error:', error);
    throw error;
  }
}

export async function getVendorOrderById(id: number) {
  const { data } = await vendorApi.get(`/orders/${id}`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch vendor order details');
  }
  return data;
}

// Update vendor order status
export async function updateVendorOrderStatus({ order_id, status }: { order_id: number; status: string }) {
  const { data } = await vendorApi.post('/orders/vendor-update-status', { order_id, status });
  return data;
}

// Bulk update vendor order status
export async function bulkUpdateVendorOrderStatus({ order_ids, status }: { order_ids: number[]; status: string }) {
  const { data } = await vendorApi.post('/orders/vendor-bulk-update-status', { order_ids, status });
  return data;
}

// Vendor Delivery Assignment API Functions
export async function getAvailableDeliveryForVendor(orderId: number) {
  const { data } = await vendorApi.get(`/orders/${orderId}/available-delivery`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch available delivery personnel');
  }
  return data.data;
}

export async function assignDeliveryToOrder(orderId: number, deliveryId: number, estimatedPickupTime?: string, notes?: string) {
  console.log('[assignDeliveryToOrder] Called with:', { orderId, deliveryId, estimatedPickupTime, notes }); // DEBUG LOG
  const { data } = await vendorApi.post('/orders/vendor-assign-delivery', {
    order_id: orderId,
    delivery_id: deliveryId,
    estimated_pickup_time: estimatedPickupTime,
    notes
  });
  console.log('[assignDeliveryToOrder] Response:', data); // DEBUG LOG
  if (!data.success) {
    throw new Error(data.message || 'Failed to assign delivery');
  }
  return data;
} 

// Vendor Payments API Function
export async function getVendorPayments({ page = 1, limit = 20, search = '', status }: { page?: number; limit?: number; search?: string; status?: string } = {}) {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  if (status) params.status = status;
  const { data } = await vendorApi.get('/vendor/payments', { params });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch vendor payments');
  }
  return data;
} 

// Vendor Subscription Status API Function
export async function getVendorSubscriptionStatus() {
  try {
    const { data } = await vendorApi.get('/subscriptions/vendor-status', {
      params: { _t: Date.now() } // Force fresh data
    });
    console.log('[VENDOR API] Raw subscription status API response:', data); // DEBUG LOG
    if (!data.success || !data.data) {
      console.error('[VENDOR API] Subscription status API error:', data);
      throw new Error(data.message || 'Failed to fetch vendor subscription status');
    }
    return data.data;
  } catch (error) {
    console.error('[VENDOR API] getVendorSubscriptionStatus threw error:', error);
    throw error;
  }
}

// Subscribe to a package (with duration and num_products)
export async function subscribeToPackage(payload: Record<string, unknown>) {
  const { data } = await vendorApi.post('/subscriptions/subscribe', payload);
  if (!data || data.error) {
    throw new Error(data?.error || 'Failed to subscribe to package');
  }
  return data;
}

// Get current vendor's subscriptions
export async function getVendorSubscriptions() {
  // Add cache-busting param to always get fresh data
  const { data } = await vendorApi.get('/subscriptions/my-subscriptions', { params: { _t: Date.now() } });
  if (!data) throw new Error('Failed to fetch subscriptions');
  return data;
}

// Fetch all subscription packages
export async function getAllSubscriptionPackages() {
  const { data } = await vendorApi.get('/subscriptions/packages');
  if (!data) throw new Error('Failed to fetch packages');
  return data;
}

// Fetch subscription packages by vendor type
export async function getSubscriptionPackagesByVendorType(vendorTypeId: number) {
  const { data } = await vendorApi.get(`/subscriptions/packages/vendor-type/${vendorTypeId}`);
  if (!data) throw new Error('Failed to fetch packages for vendor type');
  return data;
}

// Vendor Categories API Function
export async function getVendorCategories() {
  const { data } = await vendorApi.get('/categories');
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to fetch categories');
  }
  return data.data;
}

// Vendor Product Summary API Function (calculated on frontend)
export async function getVendorProductSummary() {
  // Since there's no dedicated summary endpoint, we'll calculate it from the products list
  const products = await getVendorProducts({ page: 1, limit: 1000 });
  
  let totalValue = 0;
  let totalStock = 0;
  let activeProducts = 0;
  let inactiveProducts = 0;

  for (const product of products) {
    const price = product.price || 0;
    const stock = product.stock || 0;
    const status = product.status || 'inactive';
    
    totalValue += price * stock;
    totalStock += stock;
    if (status === 'active') {
      activeProducts++;
    } else {
      inactiveProducts++;
    }
  }

  return {
    totalProducts: products.length,
    totalValue,
    totalStock,
    activeProducts,
    inactiveProducts,
  };
}

// Activate a subscription payment
export async function activateSubscriptionPayment(paymentId: number) {
  const { data } = await vendorApi.put(`/payments/subscription-payments/${paymentId}/activate`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to activate subscription payment');
  }
  return data;
}

export default vendorApi; 