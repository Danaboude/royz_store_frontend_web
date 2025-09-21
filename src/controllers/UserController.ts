import { api } from '@/services/api';
import type { User } from '@/models/types';

export class UserController {
  /**
   * Handle user authentication
   */
  static async authenticate(email: string, password: string): Promise<{ user: User }> {
    try {
      const response = await api.auth.login(email, password);
      return response;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle user registration
   */
  static async register(name: string, email: string, password: string): Promise<{ user: User }> {
    try {
      const response = await api.auth.register(name, email, password);
      return response;
    } catch (error) {
      throw new Error(`Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    try {
      const response = await api.auth.me();
      return response.user;
    } catch (error) {
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User> {
    try {
      const user = await api.users.getById(id);
      return user;
    } catch (error) {
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle user logout
   */
  static async logout(): Promise<void> {
    try {
      await api.auth.logout();
    } catch (error) {
      throw new Error(`Logout failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 