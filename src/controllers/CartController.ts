import { api } from '@/services/api';
import type { Cart, CartItem } from '@/models/types';

export class CartController {
  /**
   * Get user's cart
   */
  static async getCart(): Promise<Cart> {
    try {
      const cart = await api.cart.get();
      return cart;
    } catch (error) {
      throw new Error(`Failed to get cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(productId: number, quantity: number): Promise<Cart> {
    try {
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const cart = await api.cart.addItem(productId, quantity);
      return cart;
    } catch (error) {
      throw new Error(`Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    try {
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }
      
      const cart = await api.cart.updateItem(itemId, quantity);
      return cart;
    } catch (error) {
      throw new Error(`Failed to update cart item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(itemId: number): Promise<Cart> {
    try {
      const cart = await api.cart.removeItem(itemId);
      return cart;
    } catch (error) {
      throw new Error(`Failed to remove item from cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cart total
   */
  static calculateCartTotal(cart: Cart): number {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Get cart item count
   */
  static getCartItemCount(cart: Cart): number {
    return cart.items.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Check if cart is empty
   */
  static isCartEmpty(cart: Cart): boolean {
    return cart.items.length === 0;
  }

  /**
   * Find cart item by product ID
   */
  static findCartItemByProductId(cart: Cart, productId: number): CartItem | undefined {
    return cart.items.find(item => item.product_id === productId);
  }

  /**
   * Clear user's cart
   */
  static async clearCart(): Promise<{ message: string; itemsRemoved: number }> {
    try {
      const result = await api.cart.clear();
      return result;
    } catch (error) {
      throw new Error(`Failed to clear cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 