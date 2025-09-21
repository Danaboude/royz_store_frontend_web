// Re-export all types from the API service for easy access
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
} from '@/services/api';

// Additional UI-specific types
export interface ProductCardProps {
  product_id: number;
  name: string;
  price: string;
  image_url: string;
  description: string;
  category_name: string;
  vendor_name: string;
  stock: number;
  average_rating: number;
  review_count: number;
}

export interface SearchFilters {
  query: string;
  category?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
} 