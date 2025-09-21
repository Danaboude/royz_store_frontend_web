import { api, type Product, type Category } from '@/services/api';
import type { SearchFilters } from '@/models/types';

export class ProductController {
  /**
   * Get featured products (first 4 products)
   */
  static async getFeaturedProducts(): Promise<Product[]> {
    try {
      const products = await api.products.getAll();
      return products.slice(0, 4);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error('Failed to load featured products');
    }
  }

  /**
   * Get new products
   */
  static async getNewProducts(): Promise<Product[]> {
    try {
      return await api.products.getNew();
    } catch (error) {
      console.error('Error fetching new products:', error);
      throw new Error('Failed to load new products');
    }
  }

  /**
   * Get best selling products
   */
  static async getBestSellingProducts(): Promise<Product[]> {
    try {
      return await api.products.getBestSelling();
    } catch (error) {
      console.error('Error fetching best selling products:', error);
      throw new Error('Failed to load best selling products');
    }
  }

  /**
   * Get deal/offer products
   */
  static async getDealProducts(): Promise<Product[]> {
    try {
      return await api.products.getDeals();
    } catch (error) {
      console.error('Error fetching deal products:', error);
      throw new Error('Failed to load deal products');
    }
  }

  /**
   * Get discounted products
   */
  static async getDiscountedProducts(): Promise<Product[]> {
    try {
      return await api.products.getDiscounted();
    } catch (error) {
      console.error('Error fetching discounted products:', error);
      throw new Error('Failed to load discounted products');
    }
  }

  /**
   * Search products with filters
   */
  static async searchProducts(filters: SearchFilters): Promise<Product[]> {
    try {
      // For now, we'll use the basic search endpoint
      // In a real app, you might want to build a more complex query
      const products = await api.products.search(filters.query);
      
      // Apply additional filters client-side for now
      let filteredProducts = products;

      if (filters.category) {
        filteredProducts = filteredProducts.filter(
          product => product.category_id === filters.category
        );
      }

      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(
          product => parseFloat(product.price) >= filters.minPrice!
        );
      }

      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(
          product => parseFloat(product.price) <= filters.maxPrice!
        );
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          let aValue: string | number;
          let bValue: string | number;

          switch (filters.sortBy) {
            case 'name':
              aValue = a.name.toLowerCase();
              bValue = b.name.toLowerCase();
              break;
            case 'price':
              aValue = parseFloat(a.price);
              bValue = parseFloat(b.price);
              break;
            case 'rating':
              aValue = a.average_rating;
              bValue = b.average_rating;
              break;
            default:
              return 0;
          }

          if (filters.sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1;
          }
          return aValue > bValue ? 1 : -1;
        });
      }

      return filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error('Failed to search products');
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: number): Promise<Product[]> {
    try {
      return await api.products.getByCategory(categoryId);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Failed to load products for this category');
    }
  }

  /**
   * Get product details
   */
  static async getProductDetails(productId: number): Promise<Product> {
    try {
      return await api.products.getById(productId);
    } catch (error) {
      console.error('Error fetching product details:', error);
      throw new Error('Failed to load product details');
    }
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<Category[]> {
    try {
      return await api.categories.getAll();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to load categories');
    }
  }

  /**
   * Get category details
   */
  static async getCategoryDetails(categoryId: number): Promise<Category> {
    try {
      return await api.categories.getById(categoryId);
    } catch (error) {
      console.error('Error fetching category details:', error);
      throw new Error('Failed to load category details');
    }
  }
} 