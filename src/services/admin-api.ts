import axios from 'axios';
import { QueryFunctionContext } from '@tanstack/react-query';

const API_URL =process.env.NEXT_PUBLIC_API_URL|| 'https://api.royzstore.com';

const adminApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Add request interceptor to include JWT token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or show login modal
      console.error('Authentication failed: 401 Unauthorized');
      // You can redirect to login page here
      // window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('Authorization failed: 403 Forbidden - Insufficient permissions');
      // You can show an error message or redirect to unauthorized page
      // window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

// Type definitions
export interface Product {
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  vendor_id: number;
  [key: string]: unknown;
}

export interface NewProduct extends Omit<Product, 'product_id' | 'created_at' | 'updated_at'> {
  product_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  category_id: number;
  name_en: string;
  name_ar?: string;
  description_en?: string;
  description_ar?: string;
  [key: string]: unknown;
}

interface User {
  name?: string;
  email?: string;
  role_id?: number;
  profile_image?: string;
  [key: string]: unknown;
}

interface VendorType {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  profile_image: string;
  is_active: number;
  is_verified: number;
  created_at: string;
  role_id: number;
  role_name: string;
  business_name: string;
  business_license: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website: string;
  vendor_type_id: number;
  type_name: string;
  commission_rate: number;
  subscription_id: number;
  start_date: string;
  end_date: string;
  subscription_status: string;
  payment_status: string;
  amount_paid: number;
  auto_renew: number;
  package_id: number;
  package_name: string;
  package_price: number;
  duration_months: number;
  days_remaining: number;
  subscriptionStatus: string;
  statusColor: string;
}

// Delivery Personnel type
export interface DeliveryPersonnel {
  delivery_id?: number;
  name: string;
  email: string;
  phone: string;
  zone: string;
  vehicle_type: string;
  vehicle_number: string;
  is_available: boolean;
  rating?: number;
  total_deliveries?: number;
  is_verified: boolean;
}

// Dashboard
export async function getDashboardStats() {
  const response = await adminApi.get('/statistics/dashboard-summary');
  return response.data.data;
}

export async function getSalesByMonth(year: number, month?: number) {
  const params = new URLSearchParams({ year: year.toString() });
  if (month) params.append('month', month.toString());
  const response = await adminApi.get(`/statistics/sales-by-month?${params}`);
  return response.data.data;
}

// Statistics API Functions
export async function getSalesBySeller(vendorId?: number, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (vendorId) params.append('vendorId', vendorId.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await adminApi.get(`/statistics/sales-by-seller?${params}`);
  return response.data.data;
}

export async function getTopSellingProducts(limit: number = 10, period: string = '30') {
  const response = await adminApi.get(`/statistics/top-selling-products?limit=${limit}&period=${period}`);
  return response.data.data;
}

export async function getRevenueAnalytics(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await adminApi.get(`/statistics/revenue-analytics?${params}`);
  return response.data.data;
}

export async function getCustomerAnalytics() {
  const response = await adminApi.get('/statistics/customer-analytics');
  return response.data.data;
}

export async function getCustomerRetentionRate() {
  const response = await adminApi.get('/statistics/customer-retention-rate');
  return response.data.data;
}

export async function getProductPerformanceAnalytics() {
  const response = await adminApi.get('/statistics/product-performance-analytics');
  return response.data.data;
}

export async function getCategoryAnalytics() {
  const response = await adminApi.get('/statistics/category-analytics');
  return response.data.data;
}

export async function getRealTimeStats() {
  const response = await adminApi.get('/statistics/real-time-stats');
  return response.data.data;
}

export async function getVendorPerformanceComparison() {
  const response = await adminApi.get('/statistics/vendor-performance');
  return response.data.data;
}

export async function getVendorMonitoringStats({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const response = await adminApi.get(`/statistics/vendor-monitoring?${params}`);
  return response.data;
}

// Products
export async function getAdminProducts({ page = 1, limit = 20, search = '', deleted = 0 } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  params.append('deleted', String(deleted)); // NEW
  const { data } = await adminApi.get(`/products?${params.toString()}`);
  return data;
}

export async function createProduct(product: Product) {
  const { data } = await adminApi.post('/products', product);
  return data;
}

export async function createProductWithMedia(product: Product, mediaData: Array<{ url: string; type: 'image' | 'video' }>): Promise<{ product: Product; media: ProductMedia[] }> {
  const { data } = await adminApi.post('/products/with-media', { ...product, media_urls: mediaData });
  return data;
}

export async function updateProduct(id: number, product: Product) {
  const { data } = await adminApi.put(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id: number) {
  const { data } = await adminApi.delete(`/products/${id}`);
  return data;
}

export async function restoreProduct(id: number) {
  // PATCH is preferred for partial update, but PUT is used for full update. Here, we use PATCH for clarity.
  const { data } = await adminApi.patch(`/products/${id}`, { deleted: 0 });
  return data;
}

// Export/Import functions
export async function exportProductsToExcel(): Promise<Blob> {
  const response = await adminApi.get('/products/export/excel', {
    responseType: 'blob'
  });
  return response.data;
}

export async function downloadExcelTemplate(): Promise<Blob> {
  const response = await adminApi.get('/products/import/template', {
    responseType: 'blob'
  });
  return response.data;
}

export async function importProductsFromExcel(file: File): Promise<{ message: string; results: unknown }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await adminApi.post('/products/import/excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

// Product Media
export interface ProductMedia {
  id: number;
  product_id: number;
  url: string;
  type: 'image' | 'video';
  created_at: string;
  updated_at: string;
}

export async function getProductMedia(productId: number): Promise<ProductMedia[]> {
  const { data } = await adminApi.get(`/product-media/products/${productId}/media`);
  return data.data || data; // Return the data array, fallback to full response if structure is different
}

export async function addProductMedia(productId: number, mediaData: { url: string; type: 'image' | 'video' }): Promise<ProductMedia> {
  const { data } = await adminApi.post(`/product-media/products/${productId}/media`, mediaData);
  return data;
}

export async function deleteProductMedia(mediaId: number): Promise<{ success: boolean }> {
  const { data } = await adminApi.delete(`/product-media/media/${mediaId}`);
  return data;
}

export async function updateProductWithMedia(productId: number, productData: Product, mediaData: { toAdd: Array<{ url: string; type: 'image' | 'video' }>; toDelete: number[] }): Promise<{ product: Product; media: ProductMedia[] }> {
  const { data } = await adminApi.put(`/products/${productId}/with-media`, { ...productData, media: mediaData });
  return data;
}

export async function uploadProductMedia(productId: number, files: File[]): Promise<ProductMedia[]> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('media', file);
  });
  
  const { data } = await adminApi.post(`/product-media/products/${productId}/upload`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.data;
}

export async function uploadMediaWithoutProduct(files: File[]): Promise<Array<{ url: string; type: 'image' | 'video'; filename: string; originalname: string }>> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('media', file);
  });
  
  const { data } = await adminApi.post('/product-media/upload', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data.data;
}

export async function getProductDetails(id: number) {
  const { data } = await adminApi.get(`/products/${id}/details`);
  return data.data;
}

// Categories
export async function getAdminCategories() {
  const { data } = await adminApi.get('/categories');
  return data.data || data; // Return the data array, fallback to full response if structure is different
}

export async function createCategory(category: Partial<Omit<Category, 'category_id' | 'order' | 'created_at'>>) {
  const { data } = await adminApi.post('/categories', category);
  return data;
}

export async function updateCategory(id: number, category: Partial<Category>) {
  const { data } = await adminApi.put(`/categories/${id}`, category);
  return data;
}

export async function deleteCategory(id: number) {
  const { data } = await adminApi.delete(`/categories/${id}`);
  return data;
}

export async function reorderCategories(order: number[]) {
  const { data } = await adminApi.put('/categories/order', { order });
  return data;
}

// api function (callable anywhere)
export async function getAdminOrders({
  page = 1,
  limit = 20,
  search = '',
}: { page?: number; limit?: number; search?: string } = {}) {
  const params = new URLSearchParams();
  if (limit > 0) params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);

  const response = await adminApi.get(`/orders?${params.toString()}`);
  const payload = response.data;

  const orders = payload.data?.orders || payload.data || payload.orders || [];
  const total =
    payload.pagination?.totalPages ||
    payload.data?.totalPages ||
    orders.length ||
    0;
  const totalorders =
    payload.pagination?.total ||
    payload.data?.totalPages ||
    orders.length ||
    0;

  return { data: orders, total, totalorders };
}

// react-query wrapper

export async function getAdminOrdersQuery(
  context: QueryFunctionContext<[string, number?, number?, string?]>
) {
  const [, page = 1, limit = 20, search = ''] = context.queryKey;
  return getAdminOrders({ page, limit, search });
}




export async function getAdminOrderById(id: number) {
  const { data } = await adminApi.get(`/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id: number, status: string) {
  const { data } = await adminApi.put(`/orders/${id}/status`, { status });
  return data;
}

export async function updateOrderDetails(id: number, orderData: {

  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  address_id?: number | null;
  delivery_zone_id?: number | null;
  notes?: string;

}) {
    try {
    const { data } = await adminApi.put(`/orders/${id}`, orderData);
        return data;
  } catch (error) {
    console.error('❌ [DEBUG] admin-api updateOrderDetails error:', error);
    throw error;
  }
}


// Users
export async function getAdminUsers({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const { data } = await adminApi.get(`/users?${params.toString()}`);
  return data;
}
export async function getAllVendorTypes() {
  const { data } = await adminApi.get('/users/vendors/all-types');
  return data;
}

// Vendor-specific API functions
export async function getVendorById(id: number) {
  const { data } = await adminApi.get(`/users/vendors/${id}`);
  return data;
}

export async function updateVendor(id: number, vendorData: Partial<VendorType>) {
  const { data } = await adminApi.put(`/users/vendors/${id}`, vendorData);
  return data;
}

export async function deleteVendor(id: number) {
  const { data } = await adminApi.delete(`/users/vendors/${id}`);
  return data;
}

export async function toggleVendorStatus(id: number) {
  const { data } = await adminApi.put(`/users/vendors/${id}/toggle-status`);
  return data;
}

export async function updateUser(id: number, user: User | FormData) {
  // If uploading a file, remove Content-Type so axios sets it to multipart/form-data
  const isFormData = (val: unknown): val is FormData => typeof FormData !== 'undefined' && val instanceof FormData;
  if (isFormData(user)) {
    const { data } = await adminApi.put(`/users/${id}`, user, {
      headers: { 'Content-Type': undefined },
    });
    return data;
  }
  const { data } = await adminApi.put(`/users/${id}`, user);
  return data;
}

export async function deleteUser(id: number) {
  const { data } = await adminApi.delete(`/users/${id}`);
  return data;
}

// Vendor Payment type
export interface VendorPayment {
  payment_id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_email: string;
  order_id: number;
  order_total: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  payment_status: 'pending' | 'paid' | 'cancelled';
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

// Payments (Admin)
export async function getOrderPayments({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const { data } = await adminApi.get(`/payments?${params.toString()}`);
  return data;
}

export async function getSubscriptionPayments({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const { data } = await adminApi.get(`/payments/subscription-payments?${params.toString()}`);
  return data;
}

export async function getVendorPayments({ page = 1, limit = 20, search = '' } = {}) {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const { data } = await adminApi.get(`/payments/vendor-payments?${params.toString()}`);
  return data;
}

// Vendor Payments (Admin)
export async function getVendorPaymentsList(): Promise<VendorPayment[]> {
  const { data } = await adminApi.get('/payments/vendor-payments');
  return data;
}

export async function getVendorPaymentsByVendor(vendorId: number): Promise<VendorPayment[]> {
  const { data } = await adminApi.get(`/vendor-payments/vendor/${vendorId}`);
  return data;
}

export async function getVendorPaymentById(id: number): Promise<VendorPayment> {
  const { data } = await adminApi.get(`/vendor-payments/${id}`);
  return data;
}

export async function updateVendorPaymentStatus(
  id: number, 
  status: string, 
  payment_date?: string, 
  payment_method?: string
): Promise<{ message: string }> {
  const payload: { status: string; payment_date?: string; payment_method?: string } = { status };
  if (payment_date) payload.payment_date = payment_date;
  if (payment_method) payload.payment_method = payment_method;
  
  const { data } = await adminApi.put(`/users/vendor-payments/${id}/status`, payload);
  return data;
}

export async function getVendorPaymentSummary(vendorId: number): Promise<{
  total_payments: number;
  total_amount: number;
  total_commission: number;
  total_net: number;
  avg_commission_rate: number;
  paid_payments: number;
  pending_payments: number;
}> {
  const { data } = await adminApi.get(`/vendor-payments/vendor/${vendorId}/summary`);
  return data;
}

export async function createVendorPayment(paymentData: {
  vendor_id: number;
  order_id: number;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
  payment_status?: string;
  payment_method?: string;
  notes?: string;
}): Promise<{ payment_id: number; message: string }> {
  const { data } = await adminApi.post('/vendor-payments', paymentData);
  return data;
}

// Bulk operations for vendor payments
export async function bulkUpdateVendorPaymentStatus(
  paymentIds: number[], 
  status: string, 
  payment_date?: string, 
  payment_method?: string
): Promise<{ message: string; updated_count: number }> {
  const payload: { 
    payment_ids: number[]; 
    status: string; 
    payment_date?: string; 
    payment_method?: string 
  } = { payment_ids: paymentIds, status };
  if (payment_date) payload.payment_date = payment_date;
  if (payment_method) payload.payment_method = payment_method;
  
  const { data } = await adminApi.put('/vendor-payments/bulk-status', payload);
  return data;
}

// Export vendor payments to CSV/Excel
export async function exportVendorPayments(
  format: 'csv' | 'excel' = 'csv',
  filters?: {
    status?: string;
    vendor_id?: number;
    start_date?: string;
    end_date?: string;
  }
): Promise<Blob> {
  const params = new URLSearchParams({ format });
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
  }
  
  const response = await adminApi.get(`/vendor-payments/export?${params}`, {
    responseType: 'blob'
  });
  return response.data;
}

// Delivery Personnel (Admin)
export async function getDeliveryPersonnel() {
  const { data } = await adminApi.get('/delivery/personnel');
  return data;
}

export async function addDeliveryPersonnel(personnel: DeliveryPersonnel) {
  const { data } = await adminApi.post('/delivery/personnel', personnel);
  return data;
}

export async function updateDeliveryPersonnel(id: number, personnel: DeliveryPersonnel) {
  const { data } = await adminApi.put(`/delivery/personnel/${id}`, personnel);
  return data;
}

export async function deleteDeliveryPersonnel(id: number) {
  const { data } = await adminApi.delete(`/delivery/personnel/${id}`);
  return data;
}

// Delivery Zones
export async function getDeliveryZones() {
  const { data } = await adminApi.get('/delivery/zones');
  return data;
}

export async function createDeliveryZone(zone: { name_en: string; name_ar: string; description?: string; delivery_fee: number; estimated_delivery_time: number }) {
  const { data } = await adminApi.post('/delivery/zones', zone);
  return data;
}

export async function updateDeliveryZone(zone_id: number, zone: { name_en: string; name_ar: string; description?: string; delivery_fee: number; estimated_delivery_time: number }) {
  const { data } = await adminApi.put(`/delivery/zones/${zone_id}`, zone);
  return data;
}

export async function deleteDeliveryZone(zone_id: number) {
  const { data } = await adminApi.delete(`/delivery/zones/${zone_id}`);
  return data;
}

// Get delivery personnel earnings
export async function getDeliveryPersonnelEarnings(delivery_id: number) {
  const { data } = await adminApi.get(`/delivery/personnel/${delivery_id}/earnings`);
  return data.data.earnings;
}

// Unassigned Orders
export async function getUnassignedOrders() {
  const { data } = await adminApi.get('/delivery/orders/unassigned');
  return data;
}

// Available Delivery Personnel
export async function getAvailableDeliveryPersonnel() {
  const { data } = await adminApi.get('/delivery/personnel/available');
  return data;
}

// Assign Order to Delivery Personnel
export async function assignOrderToDelivery(order_id: number, delivery_id: number, notes?: string) {
  const payload: { order_id: number; delivery_id: number; notes?: string } = { order_id, delivery_id };
  if (notes) payload.notes = notes;
  

  
  const { data } = await adminApi.post('/delivery/orders/assign', payload);
  return data;
}

// Tracking for an Order
export async function getOrderTracking(orderId: number) {
  const { data } = await adminApi.get(`/delivery/orders/${orderId}/tracking`);
  return data;
}

// Coupons/Promotions
export interface Coupon {
  coupon_id?: number;
  code: string;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  min_order_amount?: number | null;
  max_uses?: number | null;
  used_count?: number | null;
  expire_at?: string | null;
  is_active?: boolean | number;
  created_at?: string;
  // Add any other fields from the coupons table as needed
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  const response = await adminApi.get('/coupons');
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data.data)) return response.data.data;
  return [];
}

export async function createCoupon(coupon: Coupon) {
  const response = await adminApi.post('/coupons', coupon);
  return response.data.data || response.data;
}

export async function updateCoupon(id: number, coupon: Coupon) {
  const response = await adminApi.put(`/coupons/${id}`, coupon);
  return response.data.data || response.data;
}

export async function deleteCoupon(id: number) {
  const response = await adminApi.delete(`/coupons/${id}`);
  return response.data.data || response.data;
}

// Banner type
export interface Banner {
  id?: number;
  image_url: string;
  link?: string;
  order?: number;
  is_active?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

// Banner API functions
export async function getAdminBanners(): Promise<Banner[]> {
  const { data } = await adminApi.get('/banners');
  return data;
}

export async function createBanner(banner: Banner): Promise<Banner> {
  const { data } = await adminApi.post('/banners', banner);
  return data;
}

export async function updateBanner(id: number, banner: Banner): Promise<Banner> {
  const { data } = await adminApi.put(`/banners/${id}`, banner);
  return data;
}

export async function deleteBanner(id: number): Promise<{ success: boolean }> {
  const { data } = await adminApi.delete(`/banners/${id}`);
  return data;
}

// Site Settings API
export async function getSiteSettings(): Promise<Record<string, string>> {
  const { data } = await adminApi.get('/static-pages/site-settings');
  return data;
}

export async function updateSiteSetting(key: string, value: string): Promise<unknown> {
  const { data } = await adminApi.post('/static-pages/site-settings', { [key]: value });
  return data;
}

// Reviews (Admin)
export interface AdminReview {
  review_id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  product_name?: string;
  customer_name?: string;
}

export async function getAdminReviews({ page = 1, limit = 20, search = '' } = {}): Promise<{ data: AdminReview[]; total: number; page: number; pageSize: number }> {
  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('limit', String(limit));
  if (search) params.append('search', search);
  const { data } = await adminApi.get(`/reviews?${params.toString()}`);
  return data;
}

export async function updateAdminReview(id: number, review: Partial<AdminReview>): Promise<AdminReview> {
  const { data } = await adminApi.put(`/reviews/${id}`, review);
  return data;
}

export async function deleteAdminReview(id: number): Promise<{ success: boolean }> {
  const { data } = await adminApi.delete(`/reviews/${id}`);
  return data;
}

// Vendor Analytics Types
export interface VendorAnalytics {
  user_id: number;
  vendor_name: string;
  vendor_email: string;
  vendor_phone: string;
  vendor_type: string;
  commission_rate: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  total_net: number;
  avg_commission_rate: number;
  paid_payments: number;
  pending_payments: number;
  cancelled_payments: number;
  subscription_status: string;
  subscription_end: string;
  package_name: string;
  package_price: number;
  registration_date: string;
}

export interface VendorPerformanceData {
  date: string;
  orders: number;
  revenue: number;
  active_vendors: number;
}

export interface TopVendor {
  vendor_name: string;
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
}

export interface CommissionAnalytics {
  vendor_type: string;
  vendor_count: number;
  total_commission: number;
  avg_commission_rate: number;
}

export interface VendorAnalyticsResponse {
  vendors: VendorAnalytics[];
  performanceData: VendorPerformanceData[];
  topVendors: TopVendor[];
  commissionAnalytics: CommissionAnalytics[];
}

export interface VendorDetailAnalytics {
  vendor: VendorAnalytics;
  monthlyPerformance: Array<{
    month: string;
    orders: number;
    revenue: number;
    commission: number;
  }>;
  topProducts: Array<{
    product_id: number;
    product_name: string;
    price: number;
    times_ordered: number;
    total_revenue: number;
  }>;
}

// Vendor Analytics API Functions
export async function getVendorAnalytics(): Promise<VendorAnalyticsResponse> {
  const { data } = await adminApi.get('/statistics/vendor-analytics');
  return data.data;
}

export async function getVendorAnalyticsById(vendorId: number): Promise<VendorDetailAnalytics> {
  const { data } = await adminApi.get(`/statistics/vendor-analytics/${vendorId}`);
  return data.data;
}

// Subscription Packages
export interface SubscriptionPackage {
  package_id: number;
  vendor_type_id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  price_2weeks?: number;
  duration_months: number;
  features_en: string;
  features_ar: string;
  max_products: number;
  commission_rate: number;
  is_active: boolean;
  is_popular: boolean;
  created_at: string;
}

export async function getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
  const response = await adminApi.get('/subscriptions/packages');
  return response.data;
}

export async function getSubscriptionPackagesByVendorType(vendorTypeId: number): Promise<SubscriptionPackage[]> {
  const response = await adminApi.get(`/subscriptions/packages/vendor-type/${vendorTypeId}`);
  return response.data;
}

// Update assignSubscriptionToVendor type to allow duration_days, duration_months, and num_products
export interface AssignSubscriptionPayload {
  user_id: number;
  package_id: number;
  duration_months?: number;
  duration_days?: number;
  num_products?: number;
  auto_renew?: boolean;
}

export async function assignSubscriptionToVendor(data: AssignSubscriptionPayload): Promise<{ message: string; subscription_id?: number }> {
  const response = await adminApi.post('/subscriptions/assign-subscription', data);
  return response.data;
}

export async function getVendorCurrentSubscription(vendorId: number): Promise<{
  subscription_id: number;
  user_id: number;
  package_id: number;
  package_name: string;
  duration_months: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  is_active: boolean;
} | null> {
  try {
    const response = await adminApi.get(`/subscriptions/vendor/${vendorId}/current`);
    return response.data.data || null;
  } catch (error: unknown) {
    // If no subscription found, return null
    if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// NOTIFICATION API FUNCTIONS
// ============================================================================

// Notification types
export interface Notification {
  notification_id: number;
  user_id: number;
  message: string;
  is_read: number;
  type: 'order' | 'message' | 'promotion' | 'delivery' | 'system' | 'review' | 'inventory' | 'reminder';
  related_id?: number;
  created_at: string;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Array<{ type: string; count: number }>;
  recentNotifications: number;
  activeTokens: number;
}

export interface FCMTokenStats {
  tokensByDevice: Array<{ device_type: string; count: number }>;
  tokensByRole: Array<{ role_id: number; count: number }>;
}

export interface SendNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface SendToUserPayload extends SendNotificationPayload {
  userId: number;
}

export interface SendToRolePayload extends SendNotificationPayload {
  roleId: number;
}

// Get notification statistics
export async function getNotificationStats(): Promise<NotificationStats> {
  const { data } = await adminApi.get('/notifications/stats');
  return data.data;
}

// Get FCM token statistics
export async function getFCMTokenStats(): Promise<FCMTokenStats> {
  const { data } = await adminApi.get('/notifications/fcm-stats');
  return data.data;
}

// Send notification to specific user
export async function sendNotificationToUser(payload: SendToUserPayload): Promise<{ success: boolean; message: string; data?: RoleNotificationPayload }> {
  const { data } = await adminApi.post('/notifications/send-to-user', payload);
  return data;
}
// First, let's define all the necessary types based on the backend responses
interface NotificationBase {
  title: string;
  body: string;
  data?: Record<string, string>;
}
interface UserNotificationPayload extends NotificationBase {
  userId: string | number;
}
interface RoleNotificationPayload extends NotificationBase {
  roleId: string | number;
}



// Send notification to users by role
export async function sendNotificationToRole(payload: SendToRolePayload): Promise<{ success: boolean; message: string; data?: RoleNotificationPayload }> {
  const { data } = await adminApi.post('/notifications/send-to-role', payload);
  return data;
}

// Send notification to all vendors
export async function sendNotificationToVendors(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; data?:  RoleNotificationPayload}> {
  const { data } = await adminApi.post('/notifications/send-to-vendors', payload);
  return data;
}

// Send notification to all customers
export async function sendNotificationToCustomers(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; data?: UserNotificationPayload }> {
  const { data } = await adminApi.post('/notifications/send-to-customers', payload);
  return data;
}

// Send notification to all users
export async function sendNotificationToAllUsers(payload: SendNotificationPayload): Promise<{ success: boolean; message: string; data?: RoleNotificationPayload }> {
  const { data } = await adminApi.post('/notifications/send-to-all', payload);
  return data;
}